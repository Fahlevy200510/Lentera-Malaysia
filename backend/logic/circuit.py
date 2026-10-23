import collections

# Arah relatif dari sel: (dx, dy), dilihat siswa dari atas papan.
# A1 = x=0, y=0 (paling dekat siswa). "Atas" = menjauhi siswa = menuju baris 5.
DIRECTIONS = {
    "Atas": (0, 1),
    "Bawah": (0, -1),
    "Kiri": (-1, 0),
    "Kanan": (1, 0)
}

CW_ORDER = ["Atas", "Kanan", "Bawah", "Kiri"]

OPPOSITE = {
    "Atas": "Bawah",
    "Bawah": "Atas",
    "Kiri": "Kanan",
    "Kanan": "Kiri"
}

# Sisi terminal default (rotasi 0) untuk setiap komponen
COMPONENT_DEFAULT_SIDES = {
    "straight_cable": ["Kiri", "Kanan"],      # ─
    "l_cable": ["Atas", "Kanan"],             # └
    "t_cable": ["Kiri", "Kanan", "Bawah"],    # ┬
    "battery": ["Atas", "Bawah"],             # + di Atas, - di Bawah
    "lamp": ["Kiri", "Kanan"],                # + di Kiri, - di Kanan
    "switch": ["Atas", "Bawah", "Kiri", "Kanan"], # Bodi saklar pas di slot; status ON/OFF ditentukan rotasi tuas
    "resistor": ["Kiri", "Kanan"],            # 0/180 Horizontal, 90/270 Vertikal
}

def cell_to_xy(cell_name):
    x = ord(cell_name[0]) - ord('A')
    y = int(cell_name[1]) - 1
    return x, y

def xy_to_cell(x, y):
    if 0 <= x <= 4 and 0 <= y <= 4:
        return f"{chr(x + ord('A'))}{y + 1}"
    return None

def get_component_terminals(component, rotation):
    """Mengembalikan sisi kutub (+ dan -) untuk Baterai dan Lampu berdasarkan rotasi."""
    steps = (rotation // 90) % 4
    if component == "battery":
        pos = CW_ORDER[(CW_ORDER.index("Atas") + steps) % 4]
        neg = CW_ORDER[(CW_ORDER.index("Bawah") + steps) % 4]
        return {"+": pos, "-": neg}
    elif component == "lamp":
        pos = CW_ORDER[(CW_ORDER.index("Kiri") + steps) % 4]
        neg = CW_ORDER[(CW_ORDER.index("Kanan") + steps) % 4]
        return {"+": pos, "-": neg}
    return None

def get_open_sides(component, rotation):
    """Mengembalikan sisi-sisi yang secara fisik memiliki terminal terbuka."""
    if component not in COMPONENT_DEFAULT_SIDES:
        return ["Atas", "Bawah", "Kiri", "Kanan"]

    steps = (rotation // 90) % 4
    return [CW_ORDER[(CW_ORDER.index(s) + steps) % 4] for s in COMPONENT_DEFAULT_SIDES[component]]

def get_step_direction(from_cell, to_cell):
    """Arah kardinal dari from_cell ke to_cell."""
    fx, fy = cell_to_xy(from_cell)
    tx, ty = cell_to_xy(to_cell)
    diff = (tx - fx, ty - fy)
    for side, delta in DIRECTIONS.items():
        if delta == diff:
            return side
    return None

def build_graph(grid_state_cells):
    """
    Membangun graf konektivitas adjacency list (dict of sets).
    Dua node terhubung JIKA KEDUANYA membuka sisi yang berhadapan.
    """
    graph = collections.defaultdict(set)
    
    for cell_name, state in grid_state_cells.items():
        if state is None: continue
        
        x, y = cell_to_xy(cell_name)
        open_sides = get_open_sides(state["component"], state["rotation"])
        
        for side in open_sides:
            dx, dy = DIRECTIONS[side]
            nx, ny = x + dx, y + dy
            neighbor_name = xy_to_cell(nx, ny)
            
            if neighbor_name and grid_state_cells.get(neighbor_name) is not None:
                n_state = grid_state_cells[neighbor_name]
                n_open_sides = get_open_sides(n_state["component"], n_state["rotation"])
                
                # Cek apakah tetangga juga membuka sisi ke arah KITA
                if OPPOSITE[side] in n_open_sides:
                    graph[cell_name].add(neighbor_name)
                    graph[neighbor_name].add(cell_name)
                    
    return graph

def find_all_loops_through_battery(graph, batteries):
    """
    Mencari loop (cycle) sederhana yang memuat setidaknya satu baterai.
    Menggunakan DFS.
    """
    loops = []
    
    for start_node in batteries:
        stack = [(start_node, [start_node])]
        
        while stack:
            curr, path = stack.pop()
            
            for neighbor in graph.get(curr, []):
                if len(path) > 1 and neighbor == path[-2]:
                    continue
                    
                if neighbor == start_node:
                    loops.append(path)
                elif neighbor not in path:
                    stack.append((neighbor, path + [neighbor]))
                    
    return loops

def orient_loop_from_battery_pos(loop, grid_state_cells):
    """
    Mengorientasikan urutan loop agar mengalir dari kutub (+) baterai menuju kutub (-).
    """
    b_cell = loop[0]
    next_cell = loop[1]
    side_to_next = get_step_direction(b_cell, next_cell)
    b_terms = get_component_terminals("battery", grid_state_cells[b_cell]["rotation"])
    
    # Jika jalur awal keluar dari kutub (-), balik urutan agar selalu (+) -> (-)
    if b_terms and side_to_next == b_terms["-"]:
        return [b_cell] + list(reversed(loop[1:]))
    return loop

def evaluate_circuit(grid_state_cells):
    """
    Evaluasi kelayakan sirkuit berdasarkan hukum fisika:
    1. Deteksi baterai & lampu
    2. Peringatan short circuit (korsleting) prioritas utama
    3. Saklar mati (switch_off)
    4. Polaritas lampu (forward bias: + baterai ke + lampu)
    """
    batteries = [cell for cell, state in grid_state_cells.items() if state and state["component"] == "battery"]
    lamps = [cell for cell, state in grid_state_cells.items() if state and state["component"] == "lamp"]
    
    if not batteries:
        return {"status": "no_battery", "narration": "Baterai tidak terdeteksi."}
        
    graph = build_graph(grid_state_cells)
    loops = find_all_loops_through_battery(graph, batteries)
    
    # 1. Cek Korsleting (Short Circuit): Prioritas tertinggi, dilaporkan segera jika baterai terhubung langsung tanpa beban
    short_loops = []
    for loop in loops:
        has_load = any(grid_state_cells[c]["component"] in ["lamp", "resistor"] for c in loop)
        if not has_load:
            has_off_switch = any(
                grid_state_cells[c]["component"] == "switch" and grid_state_cells[c]["rotation"] in [0, 180]
                for c in loop
            )
            if not has_off_switch:
                short_loops.append(loop)
            
    if short_loops:
        return {
            "status": "short_circuit", 
            "cells": short_loops[0],
            "narration": "Peringatan, terdeteksi korsleting! Arus baterai terhubung langsung tanpa melalui beban."
        }

    if not lamps:
        return {"status": "no_lamp", "narration": "Lampu tidak terdeteksi."}
        
    # Ambil loop yang memiliki lampu
    loops_with_lamp = [loop for loop in loops if any(grid_state_cells[c]["component"] == "lamp" for c in loop)]
    if not loops_with_lamp:
        visited = set()
        def dfs_visit(node):
            if node in visited: return
            visited.add(node)
            for n in graph.get(node, []):
                dfs_visit(n)
                
        connected = False
        for b in batteries:
            visited.clear()
            dfs_visit(b)
            if any(l in visited for l in lamps):
                connected = True
                break
                
        if not connected:
            return {"status": "not_connected", "narration": "Baterai dan lampu belum terhubung."}
        return {"status": "open_circuit", "narration": "Rangkaian masih terbuka dan belum membentuk loop tertutup."}
        
    # Klasifikasi topologi: Seri (1 loop), Paralel (>1 loop)
    graph_type = "series" if len(loops_with_lamp) == 1 else "parallel"
    
    # 2. Cek Saklar (Switch)
    active_loops = []
    min_off_switches = float('inf')
    off_switches_in_best_loop = []
    
    for loop in loops_with_lamp:
        off_switches = [
            c for c in loop
            if grid_state_cells[c]["component"] == "switch" and grid_state_cells[c]["rotation"] in [0, 180]
        ]
        if len(off_switches) == 0:
            active_loops.append(loop)
        elif len(off_switches) < min_off_switches:
            min_off_switches = len(off_switches)
            off_switches_in_best_loop = off_switches
            
    if not active_loops:
        cells_str = ", ".join(off_switches_in_best_loop)
        return {
            "status": "switch_off", 
            "cells": off_switches_in_best_loop,
            "narration": f"Rangkaian belum menyala. Saklar di {cells_str} dalam posisi mati."
        }
        
    # 3. Cek Polaritas Lampu (+ Baterai -> + Lampu / Anoda)
    successful_loops = []
    reversed_lamp_cells = set()
    
    for loop in active_loops:
        oriented = orient_loop_from_battery_pos(loop, grid_state_cells)
        loop_polarity_ok = True
        
        for i, cell in enumerate(oriented):
            if grid_state_cells[cell]["component"] == "lamp":
                prev_cell = oriented[i - 1]
                entry_dir = get_step_direction(prev_cell, cell)
                entry_side_on_lamp = OPPOSITE[entry_dir]
                l_terms = get_component_terminals("lamp", grid_state_cells[cell]["rotation"])
                
                # Forward bias: arus masuk ke sisi (+) anoda
                if l_terms and entry_side_on_lamp == l_terms["+"]:
                    pass
                else:
                    loop_polarity_ok = False
                    reversed_lamp_cells.add(cell)
                    
        if loop_polarity_ok:
            successful_loops.append(loop)
            
    if successful_loops:
        return {
            "status": "success", 
            "graph_type": graph_type,
            "narration": f"Rangkaian berhasil, lampu menyala. Jenis rangkaian: {'seri' if graph_type == 'series' else 'paralel'}."
        }
        
    cells_str = ", ".join(sorted(reversed_lamp_cells))
    return {
        "status": "polarity_reversed",
        "cells": list(reversed_lamp_cells),
        "narration": f"Lampu di {cells_str} tidak menyala karena kutub terbalik. Sambungkan kutub positif baterai ke kutub positif lampu."
    }
