import asyncio
import websockets
import cv2
import dlib
import numpy as np
import pyautogui

# Initialize dlib's face detector and facial landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Screen size for mouse movement
screen_width, screen_height = pyautogui.size()
pyautogui.FAILSAFE = False

async def track_head():
    # Access the webcam
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        _, frame = cap.read()
        # Resize frame for faster processing
        frame = cv2.resize(frame, (640, 480))
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces in the grayscale frame
        faces = detector(gray, 0)
        
        for face in faces:
            landmarks = predictor(gray, face)
            
            # Highlight the nose point specifically
            nose_point = (landmarks.part(33).x, landmarks.part(33).y)
            
            # Calculate the relative position of the nose point to control the mouse
            relative_x = 1 - (nose_point[0] / frame.shape[1])
            relative_y = nose_point[1] / frame.shape[0]
            
            # Map the nose's position to the screen's width and height
            mouse_x = int(screen_width * relative_x)
            mouse_y = int(screen_height * relative_y)
            
            # Move the mouse cursor
            pyautogui.moveTo(mouse_x, mouse_y)

        # Break the loop if needed based on your stop condition or message received
        if stop_tracking:
            break

    cap.release()
    cv2.destroyAllWindows()

async def handler(websocket, path):
    global stop_tracking
    async for message in websocket:
        if message == "move mouse":
            stop_tracking = False
            await track_head()
        elif message == "stop mouse":
            stop_tracking = True

stop_tracking = False
start_server = websockets.serve(handler, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
