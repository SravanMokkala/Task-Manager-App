# Task Tracker Application

A modern, responsive web application for managing multiple task lists and tasks. Built with Python Flask backend and JavaScript frontend.

## ✨ Features

### Task Lists Management
- ✅ Create multiple task lists (e.g., "Groceries", "Work", "Home Renovation")
- ✅ Switch between task lists seamlessly
- ✅ Edit and delete task lists
- ✅ Each list maintains its own state (tasks, completion status, etc.)

### Task Management
- ✅ Add, edit, and delete tasks within a list
- ✅ Mark tasks as complete or incomplete with one click
- ✅ Display task statuses clearly with visual indicators
- ✅ Add descriptions to tasks for better organization

### Progress Persistence
- ✅ Task data and list organization saved in SQLite database
- ✅ Data persists across browser sessions and reloads
- ✅ Real-time updates without page refresh

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **Flask-SQLAlchemy** - Database ORM
- **SQLite** - Database (file-based, no setup required)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Dynamic functionality
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome** - Icons

## 📋 Requirements

- Python 3.8 or higher
- pip (Python package installer)

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd task_tracker_app

# Or download and extract the ZIP file
# Then navigate to the task_tracker_app directory
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

### 4. Access the Application

Open your web browser and navigate to:
```
http://localhost:4000
```

## 📁 Project Structure

```
task_tracker_app/
├── app.py                 # Main Flask application with embedded models
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── static/               # Static files
│   ├── css/
│   │   └── style.css     # Custom styles
│   └── js/
│       └── app.js        # Frontend JavaScript
├── templates/            # HTML templates
│   └── index.html        # Main application template
└── task_tracker.db       # SQLite database (created automatically)
```

### Usage Guide

### Creating Task Lists
1. Click the "Create New List" button in the sidebar
2. Enter a name for your task list (e.g., "Work", "Personal", "Groceries")
3. Optionally add a description
4. Click "Create List"

### Managing Tasks
1. Select a task list from the sidebar
2. Click "Add Task" to create a new task
3. Enter a title and optional description
4. Click "Add Task" to save

### Task Actions
- **Complete/Incomplete**: Click the circle icon next to a task
- **Edit**: Click the edit icon (pencil) on a task
- **Delete**: Click the delete icon (trash) on a task

### Switching Between Lists
- Click on any task list in the sidebar to switch to it
- The current list is highlighted in blue
- Each list maintains its own tasks and progress

### Progress Tracking
- Each task list shows a progress bar
- Completed tasks are visually marked with strikethrough text
- Statistics show total tasks and completed count

## 🔧 API Endpoints

The application provides a RESTful API for all operations:

### Task Lists
- `GET /api/task-lists` - Get all task lists
- `POST /api/task-lists` - Create a new task list
- `PUT /api/task-lists/<id>` - Update a task list
- `DELETE /api/task-lists/<id>` - Delete a task list

### Tasks
- `POST /api/task-lists/<id>/tasks` - Create a new task in a list
- `PUT /api/tasks/<id>` - Update a task
- `DELETE /api/tasks/<id>` - Delete a task
- `POST /api/tasks/<id>/toggle` - Toggle task completion

## 🔒 Data Persistence

- **SQLite Database**: File-based database stored as `task_tracker.db`
- **Automatic Setup**: Database and tables are created automatically on first run
- **Data Integrity**: Foreign key relationships ensure data consistency
- **Backup Friendly**: Simple file-based storage makes backups easy

## 🚀 Deployment

### Local Development
The application is ready to run locally with the setup instructions above.


