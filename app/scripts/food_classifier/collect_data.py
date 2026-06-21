#!/usr/bin/env python3
"""
Candy Data Collection Script
Reads camera input using OpenCV, displays a preview, and saves frames for candy classification.
"""

import argparse
import os
import sys
import time
from datetime import datetime
import cv2
import numpy as np

def parse_args():
    parser = argparse.ArgumentParser(description="Collect candy images from camera for classifier training.")
    parser.add_argument("--camera", type=int, default=0, help="Camera index (default: 0)")
    parser.add_argument("--width", type=int, default=640, help="Target frame width (default: 640)")
    parser.add_argument("--height", type=int, default=480, help="Target frame height (default: 480)")
    parser.add_argument("--fps", type=int, default=5, help="Target continuous capture FPS (default: 5)")
    parser.add_argument("--output-dir", type=str, default="dataset", help="Root directory to save frames (default: dataset)")
    parser.add_argument("--classes", type=str, nargs="+", default=["candy_a", "candy_b", "candy_c"],
                        help="List of class names (default: candy_a candy_b candy_c)")
    parser.add_argument("--crop", type=int, nargs="+",
                        help="Crop region. Pass 4 integers for 'x y w h' or 2 integers for 'w h' (center-cropped).")
    return parser.parse_args()

def get_existing_counts(output_dir, classes):
    """Scan directories to get current image count for each class."""
    counts = {}
    for c in classes:
        class_dir = os.path.join(output_dir, c)
        if os.path.exists(class_dir):
            files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            counts[c] = len(files)
        else:
            counts[c] = 0
    return counts

def on_mouse(event, x, y, flags, state):
    """Callback function to handle interactive mouse cropping."""
    if state.get('setup_locked', False):
        return
        
    if event == cv2.EVENT_LBUTTONDOWN:
        state['drawing'] = True
        state['start_x'] = x
        state['start_y'] = y
        state['temp_crop_box'] = None
        
    elif event == cv2.EVENT_MOUSEMOVE:
        if state['drawing']:
            cx = min(state['start_x'], x)
            cy = min(state['start_y'], y)
            cw = abs(state['start_x'] - x)
            ch = abs(state['start_y'] - y)
            state['temp_crop_box'] = (cx, cy, cw, ch)
            
    elif event == cv2.EVENT_LBUTTONUP:
        state['drawing'] = False
        cx = min(state['start_x'], x)
        cy = min(state['start_y'], y)
        cw = abs(state['start_x'] - x)
        ch = abs(state['start_y'] - y)
        if cw > 5 and ch > 5:
            state['crop_box'] = (cx, cy, cw, ch)
            print(f"[*] New Crop Box Selected Interactively: --crop {cx} {cy} {cw} {ch}")
        state['temp_crop_box'] = None

def draw_overlay(frame, active_class, counts, continuous, target_fps, saved_recently, crop_box=None, temp_crop_box=None, setup_locked=True):
    """Draw a professional UI overlay on the frame for feedback."""
    h, w, _ = frame.shape
    
    # Draw interactive crop region outline (during selection)
    if temp_crop_box:
        tx, ty, tw, th = temp_crop_box
        cv2.rectangle(frame, (tx, ty), (tx + tw, ty + th), (255, 0, 255), 1)
        cv2.putText(frame, "Selecting...", (tx + 5, ty + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 0, 255), 1, cv2.LINE_AA)
    # Draw finalized crop box outline
    elif crop_box:
        cx, cy, cw, ch = crop_box
        # Draw a stylish border around the crop area
        cv2.rectangle(frame, (cx, cy), (cx + cw, cy + ch), (0, 255, 255), 2)
        # Add a text tag for the crop region
        cv2.putText(frame, "CROP REGION", (cx + 5, cy + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1, cv2.LINE_AA)

    overlay = frame.copy()
    
    # 1. Semi-transparent header panel
    header_height = 80
    cv2.rectangle(overlay, (0, 0), (w, header_height), (20, 20, 20), -1)
    
    # 2. Semi-transparent footer panel for controls
    footer_height = 70
    cv2.rectangle(overlay, (0, h - footer_height), (w, h), (20, 20, 20), -1)
    
    # Apply overlay transparency
    alpha = 0.75
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    
    if not setup_locked:
        # Header - Setup Mode Info
        cv2.putText(frame, "CROP SETUP PHASE", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2, cv2.LINE_AA)
        
        setup_instr = "Click & drag on image to set crop. Press [ENTER] or [SPACE] to lock it."
        cv2.putText(frame, setup_instr, (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1, cv2.LINE_AA)
        
        # Footer - Setup Mode controls
        controls_1 = "[Mouse Drag] Draw Crop Region  |  [Enter / Space] Lock Crop"
        controls_2 = "[Q] Quit Data Collection"
        cv2.putText(frame, controls_1, (20, h - 42), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1, cv2.LINE_AA)
        cv2.putText(frame, controls_2, (20, h - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1, cv2.LINE_AA)
    else:
        # Header - Active candy selection
        class_text = f"CLASS: {active_class.upper()}"
        cv2.putText(frame, class_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (50, 255, 50), 2, cv2.LINE_AA)
        
        # Count of current class
        count_text = f"Count: {counts[active_class]}"
        cv2.putText(frame, count_text, (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (240, 240, 240), 1, cv2.LINE_AA)
        
        # Status (Continuous vs Manual)
        status_x = w - 240
        status_text = "AUTO CAPTURE: ON" if continuous else "AUTO CAPTURE: OFF (Manual)"
        status_color = (0, 255, 255) if continuous else (200, 200, 200)
        cv2.putText(frame, status_text, (status_x, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2, cv2.LINE_AA)
        
        # Capture Info
        if crop_box:
            cx, cy, cw, ch = crop_box
            info_text = f"Rate: {target_fps} FPS | Crop: {cw}x{ch}"
        else:
            info_text = f"Rate: {target_fps} FPS | Res: {w}x{h}"
        cv2.putText(frame, info_text, (status_x, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1, cv2.LINE_AA)
        
        # Footer - Normal controls
        controls_1 = "[1,2,3] Class  |  [Space] Capture  |  [C] Auto  |  [R] Redo Crop"
        controls_2 = "[Q] Quit Data Collection"
        cv2.putText(frame, controls_1, (20, h - 42), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1, cv2.LINE_AA)
        cv2.putText(frame, controls_2, (20, h - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1, cv2.LINE_AA)
        
    # Visual capture feedback (flash a green border or indicator when a frame is saved)
    if saved_recently > 0:
        # Draw a green indicator dot and border
        cv2.rectangle(frame, (0, 0), (w, h), (0, 255, 0), 4)
        cv2.circle(frame, (w - 30, h - 35), 10, (0, 255, 0), -1)
        cv2.putText(frame, "SAVED", (w - 100, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2, cv2.LINE_AA)

def main():
    args = parse_args()
    
    # Create output class directories
    print(f"[*] Initializing output directories under: {args.output_dir}")
    for c in args.classes:
        class_dir = os.path.join(args.output_dir, c)
        os.makedirs(class_dir, exist_ok=True)
        
    counts = get_existing_counts(args.output_dir, args.classes)
    print("[*] Current image counts in dataset:")
    for c in args.classes:
        print(f"  - {c}: {counts[c]} images")
        
    # Active class selection index
    active_idx = 0
    active_class = args.classes[active_idx]
    
    # Initialize Camera
    print(f"[*] Opening camera index {args.camera}...")
    cap = cv2.VideoCapture(args.camera)
    
    if not cap.isOpened():
        print(f"[!] ERROR: Could not open camera with index {args.camera}.")
        print("[!] Please check if the camera is connected and index is correct.")
        print("[*] Available cameras are typically indexes 0, 1, 2, etc.")
        sys.exit(1)
        
    # Attempt to set camera properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, args.width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.height)
    
    # Query actual properties returned by the hardware
    actual_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[+] Camera opened successfully!")
    print(f"    - Requested Resolution: {args.width}x{args.height}")
    print(f"    - Actual Camera Resolution: {actual_width}x{actual_height}")
    print(f"    - Target FPS: {args.fps}")
    
    # Compute Crop Box Coordinates
    crop_box = None
    if args.crop:
        if len(args.crop) == 2:
            crop_w, crop_h = args.crop
            crop_w = min(crop_w, actual_width)
            crop_h = min(crop_h, actual_height)
            crop_x = (actual_width - crop_w) // 2
            crop_y = (actual_height - crop_h) // 2
            crop_box = (crop_x, crop_y, crop_w, crop_h)
            print(f"    - Crop Mode: CENTER crop ({crop_w}x{crop_h}) at x={crop_x}, y={crop_y}")
        elif len(args.crop) == 4:
            crop_x, crop_y, crop_w, crop_h = args.crop
            crop_x = max(0, min(crop_x, actual_width - 1))
            crop_y = max(0, min(crop_y, actual_height - 1))
            crop_w = min(crop_w, actual_width - crop_x)
            crop_h = min(crop_h, actual_height - crop_y)
            crop_box = (crop_x, crop_y, crop_w, crop_h)
            print(f"    - Crop Mode: FIXED bounding box ({crop_w}x{crop_h}) at x={crop_x}, y={crop_y}")
        else:
            print("[!] ERROR: --crop must receive either 2 arguments (w h) or 4 arguments (x y w h).")
            cap.release()
            sys.exit(1)
            
    # Interactive crop state (uses dictionary to share with cv2 mouse callback)
    state = {
        'crop_box': crop_box,
        'drawing': False,
        'start_x': -1,
        'start_y': -1,
        'temp_crop_box': None,
        'setup_locked': True if crop_box is not None else False
    }
            
    # Track continuous capture status
    continuous_mode = False
    last_saved_time = 0.0
    save_interval = 1.0 / args.fps
    
    # Flash feedback counter
    saved_recently_counter = 0
    
    window_name = "Candy Data Collection"
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    cv2.setMouseCallback(window_name, on_mouse, state)
    
    print("\n" + "="*50)
    if state['setup_locked']:
        print(" ACTIVE COLLECTION CONTROLS:")
        print(" - '1', '2', '3', ... : Switch active candy class")
        print(" - [Spacebar]         : Capture and save current frame")
        print(" - 'c'                : Toggle continuous auto-capture")
        print(" - 'r'                : Redo crop (unlock and re-enter setup)")
        print(" - 'q' or [Esc]       : Quit program")
    else:
        print(" CROP SETUP PHASE:")
        print(" - [Mouse Click/Drag] : Select crop region interactively")
        print(" - [Enter / Spacebar] : Lock the crop box and start collection")
        print(" - 'q' or [Esc]       : Quit program")
    print("="*50 + "\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[!] Failed to grab frame from camera.")
            break
            
        # Create a copy for raw saving (without overlay text)
        raw_frame = frame.copy()
        
        # Determine current time
        now = time.time()
        
        # Auto-capture logic (only allowed if setup is locked)
        should_save = False
        if state['setup_locked'] and continuous_mode and (now - last_saved_time >= save_interval):
            should_save = True
            last_saved_time = now
            
        # Keyboard handling
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q') or key == ord('Q') or key == 27:  # Quit
            print("[*] Exiting candy data collection script...")
            break
            
        # Mode-specific input handling
        if not state['setup_locked']:
            # Crop Setup Mode Controls
            if key == 13 or key == 10 or key == ord(' '):  # Enter or Spacebar
                state['setup_locked'] = True
                if state['crop_box']:
                    cx, cy, cw, ch = state['crop_box']
                    print(f"[+] Crop box locked: --crop {cx} {cy} {cw} {ch}")
                else:
                    print("[+] Crop locked to full frame (no crop).")
                    
                # Print the active controls once locked
                print("\n" + "="*50)
                print(" ACTIVE COLLECTION CONTROLS:")
                print(" - '1', '2', '3', ... : Switch active candy class")
                print(" - [Spacebar]         : Capture and save current frame")
                print(" - 'c'                : Toggle continuous auto-capture")
                print(" - 'r'                : Redo crop (unlock and re-enter setup)")
                print(" - 'q' or [Esc]       : Quit program")
                print("="*50 + "\n")
        else:
            # Active Collection Mode Controls
            # Check if number key matches index of classes list
            if ord('1') <= key < ord('1') + len(args.classes):
                idx = key - ord('1')
                active_idx = idx
                active_class = args.classes[active_idx]
                print(f"[*] Switched active class to: {active_class}")
                
            elif key == ord(' '):  # Spacebar manual capture
                should_save = True
                
            elif key == ord('c') or key == ord('C'):  # Toggle auto-capture
                continuous_mode = not continuous_mode
                print(f"[*] Auto-capture toggled: {'ON' if continuous_mode else 'OFF'}")
                
            elif key == ord('r') or key == ord('R'):  # Unlock and redo crop
                state['setup_locked'] = False
                state['crop_box'] = None
                continuous_mode = False
                print("[*] Crop box unlocked. Re-entering crop setup phase...")
                print("\n" + "="*50)
                print(" CROP SETUP PHASE:")
                print(" - [Mouse Click/Drag] : Select crop region interactively")
                print(" - [Enter / Spacebar] : Lock the crop box and start collection")
                print(" - 'q' or [Esc]       : Quit program")
                print("="*50 + "\n")
            
        # Read dynamic crop box from interactive state
        current_crop = state['crop_box']
        
        # Save frame if triggered
        if should_save:
            # Format filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"img_{timestamp}.jpg"
            filepath = os.path.join(args.output_dir, active_class, filename)
            
            # Crop the raw frame if configured
            if current_crop:
                cx, cy, cw, ch = current_crop
                save_frame = raw_frame[cy:cy+ch, cx:cx+cw]
            else:
                save_frame = raw_frame
                
            # Save the clean frame
            cv2.imwrite(filepath, save_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            counts[active_class] += 1
            saved_recently_counter = 10  # Show feedback border for 10 loop iterations
            print(f"[+] Saved: {filepath} (Total: {counts[active_class]} | Resolution: {save_frame.shape[1]}x{save_frame.shape[0]})")
            
        # Draw overlay on the display frame
        draw_overlay(frame, active_class, counts, continuous_mode, args.fps, saved_recently_counter, current_crop, state['temp_crop_box'], state['setup_locked'])
        if saved_recently_counter > 0:
            saved_recently_counter -= 1
            
        # Display the output
        cv2.imshow(window_name, frame)
        
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("[*] Camera released. Done!")

if __name__ == "__main__":
    main()
