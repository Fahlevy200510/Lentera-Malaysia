import collections

# Arah relatif dari sel: (dx, dy)
# A1 = x=0, y=0. E5 = x=4, y=4
DIRECTIONS = {
    "Atas": (0, -1),
    "Bawah": (0, 1),
    "Kiri": (-1, 0),
    "Kanan": (1, 0)
}

OPPOSITE = {
    "Atas": "Bawah",
    "Bawah": "Atas",
    "Kiri": "Kanan",
    "Kanan": "Kiri"
}

def cell_to_xy(cell_name):
    # 'A1' -> x=0, y=0
    x = ord(cell_name[0]) - ord('A')
    y = int(cell_name[1]) - 1
    return x, y

def xy_to_cell(x, y):
    if 0 <= x <= 4 and 0 <= y <= 4:
        return f"{chr(x + ord('A'))}{y + 1}"
    return None

def get_open_sides(component, rotation):
    """Mengembalikan list arah yang terbuka berdasarkan jenis komponen dan rotasi"""
    if component not in ["straight_cable", "l_cable", "t_cable"]:
        # Non-kabel terbuka ke semua 4 sisi
        return ["Atas", "Bawah", "Kiri", "Kanan"]
        
    if component == "straight_cable":
        # 0 atau 180 (di grid_state sudah dinormalkan ke 0) = Horizontal
        if rotation == 0 or rotation == 180:
            return ["Kiri", "Kanan"]
        else: # 90 atau 270 -> Vertikal
            return ["Atas", "Bawah"]
            
    elif component == "l_cable":
        # Fisik 0 deg (ArUco normal): Buka Kanan & Bawah
        if rotation == 0: return ["Kanan", "Bawah"]
        elif rotation == 90: return ["Bawah", "Kiri"]
        elif rotation == 180: return ["Kiri", "Atas"]
        elif rotation == 270: return ["Atas", "Kanan"]
        
    elif component == "t_cable":
        # Fisik 0 deg (ArUco normal): Bentuk |- -> Buka Atas, Bawah, Kanan
        if rotation == 0: return ["Atas", "Bawah", "Kanan"]
        elif rotation == 90: return ["Kiri", "Kanan", "Bawah"]
        elif rotation == 180: return ["Atas", "Bawah", "Kiri"]
        elif rotation == 270: return ["Kiri", "Kanan", "Atas"]
        
    return []

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
    Menggunakan DFS (karena node cuma maks 25, brute force ini sangat cepat).
    """
    loops = []
    
    for start_node in batteries:
        stack = [(start_node, [start_node])]
        
        while stack:
            curr, path = stack.pop()
            
            for neighbor in graph.get(curr, []):
                # Jangan kembali langsung ke node persis sebelumnya (panjang loop minimum 3)
                if len(path) > 1 and neighbor == path[-2]:
                    continue
                    
                if neighbor == start_node: # Ketemu loop kembali ke baterai awal
                    # Pastikan ini loop valid
                    loops.append(path)
                elif neighbor not in path:
                    stack.append((neighbor, path + [neighbor]))
                    
    return loops

def evaluate_circuit(grid_state_cells):
    """
    Evaluasi kelayakan berdasarkan PRD 10.1.
    """
    batteries = [cell for cell, state in grid_state_cells.items() if state and state["component"] == "battery"]
    lamps = [cell for cell, state in grid_state_cells.items() if state and state["component"] == "lamp"]
    
    if not batteries:
        return {"status": "no_battery", "narration": "No battery detected."}
    if not lamps:
        return {"status": "no_lamp", "narration": "No lamp detected."}
        
    graph = build_graph(grid_state_cells)
    
    # Cek terhubung (apakah ada baterai dan lampu di komponen graf yang sama)
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
        return {"status": "not_connected", "narration": "Battery and lamp are not connected."}
        
    loops = find_all_loops_through_battery(graph, batteries)
    
    # Cek short circuit (loop tanpa komponen beban)
    short_loops = []
    for loop in loops:
        has_load = False
        for cell in loop:
            comp = grid_state_cells[cell]["component"]
            if comp in ["lamp", "resistor"]:
                has_load = True
                break
        if not has_load:
            short_loops.append(loop)
            
    if short_loops:
        return {
            "status": "short_circuit", 
            "cells": short_loops[0],
            "narration": "Warning, short circuit detected. Battery is connected directly without a load."
        }
        
    # Ambil loop yang memiliki lampu
    loops_with_lamp = []
    for loop in loops:
        if any(grid_state_cells[c]["component"] == "lamp" for c in loop):
            loops_with_lamp.append(loop)
            
    if not loops_with_lamp:
        return {"status": "open_circuit", "narration": "The circuit is open and has not formed a closed loop."}
        
    # Klasifikasi topologi: Seri (1 loop), Paralel (>1 loop)
    graph_type = "series" if len(loops_with_lamp) == 1 else "parallel"
    
    # Cek status Switch
    best_loop = None
    min_off_switches = float('inf')
    off_switches_in_best_loop = []
    
    for loop in loops_with_lamp:
        off_switches = []
        for cell in loop:
            state = grid_state_cells[cell]
            if state["component"] == "switch" and not state.get("switch_on", False): # OFF
                off_switches.append(cell)
                
        if len(off_switches) == 0:
            return {
                "status": "success", 
                "graph_type": graph_type,
                "narration": f"Circuit successful, the lamp is on. Topology: {graph_type}."
            }
            
        if len(off_switches) < min_off_switches:
            min_off_switches = len(off_switches)
            best_loop = loop
            off_switches_in_best_loop = off_switches
            
    # Jika tidak ada yang sukses, berarti semua loop ada switch OFF
    cells_str = ", ".join(off_switches_in_best_loop)
    return {
        "status": "switch_off", 
        "cells": off_switches_in_best_loop,
        "narration": f"Circuit is not lit. Switch at {cells_str} is OFF."
    }
