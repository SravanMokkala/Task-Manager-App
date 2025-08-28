"""
Task Tracker Application
A Flask-based web application for managing multiple task lists and tasks.

This application allows users to:
- Create and manage multiple task lists (e.g., "Personal", "Work", "Groceries")
- Add, edit, and delete tasks within each list
- Mark tasks as complete or incomplete
- Persist data across browser sessions using SQLite database
- Switch between different task lists seamlessly
"""

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///task_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define models directly in app.py to avoid circular imports
class TaskList(db.Model):
    """
    TaskList model representing a collection of tasks.
    """
    __tablename__ = 'task_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    
    tasks = db.relationship('Task', backref='task_list', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<TaskList {self.name}>'

class Task(db.Model):
    """
    Task model representing an individual task item.
    """
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    task_list_id = db.Column(db.Integer, db.ForeignKey('task_lists.id'), nullable=False)
    
    def __repr__(self):
        return f'<Task {self.title}>'

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    """
    Main route - displays the task tracker interface.
    Shows all task lists and allows switching between them.
    """
    task_lists = TaskList.query.all()
    return render_template('index.html', task_lists=task_lists)

@app.route('/api/task-lists', methods=['GET'])
def get_task_lists():
    """
    API endpoint to get all task lists.
    Returns JSON data for all task lists with their associated tasks.
    """
    task_lists = TaskList.query.all()
    result = []
    
    for task_list in task_lists:
        tasks = []
        for task in task_list.tasks:
            tasks.append({
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'completed': task.completed,
                'created_at': task.created_at.isoformat(),
                'updated_at': task.updated_at.isoformat() if task.updated_at else None
            })
        
        result.append({
            'id': task_list.id,
            'name': task_list.name,
            'description': task_list.description,
            'created_at': task_list.created_at.isoformat(),
            'tasks': tasks
        })
    
    return jsonify(result)

@app.route('/api/task-lists', methods=['POST'])
def create_task_list():
    """
    API endpoint to create a new task list.
    Expects JSON data with 'name' and optional 'description'.
    """
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Task list name is required'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Task list name cannot be empty'}), 400
    
    # Check if task list with same name already exists
    existing_list = TaskList.query.filter_by(name=name).first()
    if existing_list:
        return jsonify({'error': 'Task list with this name already exists'}), 400
    
    description = data.get('description', '').strip()
    
    new_task_list = TaskList()
    new_task_list.name = name
    new_task_list.description = description
    db.session.add(new_task_list)
    db.session.commit()
    
    return jsonify({
        'id': new_task_list.id,
        'name': new_task_list.name,
        'description': new_task_list.description,
        'created_at': new_task_list.created_at.isoformat(),
        'tasks': []
    }), 201

@app.route('/api/task-lists/<int:list_id>', methods=['PUT'])
def update_task_list(list_id):
    """
    API endpoint to update an existing task list.
    Expects JSON data with 'name' and optional 'description'.
    """
    task_list = TaskList.query.get_or_404(list_id)
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Task list name is required'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Task list name cannot be empty'}), 400
    
    # Check if another task list with same name already exists
    existing_list = TaskList.query.filter_by(name=name).first()
    if existing_list and existing_list.id != list_id:
        return jsonify({'error': 'Task list with this name already exists'}), 400
    
    task_list.name = name
    task_list.description = data.get('description', '').strip()
    task_list.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'id': task_list.id,
        'name': task_list.name,
        'description': task_list.description,
        'created_at': task_list.created_at.isoformat(),
        'updated_at': task_list.updated_at.isoformat()
    })

@app.route('/api/task-lists/<int:list_id>', methods=['DELETE'])
def delete_task_list(list_id):
    """
    API endpoint to delete a task list and all its associated tasks.
    """
    task_list = TaskList.query.get_or_404(list_id)
    db.session.delete(task_list)
    db.session.commit()
    
    return jsonify({'message': 'Task list deleted successfully'})

@app.route('/api/task-lists/<int:list_id>/tasks', methods=['POST'])
def create_task(list_id):
    """
    API endpoint to create a new task within a specific task list.
    Expects JSON data with 'title' and optional 'description'.
    """
    task_list = TaskList.query.get_or_404(list_id)
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Task title is required'}), 400
    
    title = data['title'].strip()
    if not title:
        return jsonify({'error': 'Task title cannot be empty'}), 400
    
    description = data.get('description', '').strip()
    
    new_task = Task()
    new_task.title = title
    new_task.description = description
    new_task.task_list_id = list_id
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({
        'id': new_task.id,
        'title': new_task.title,
        'description': new_task.description,
        'completed': new_task.completed,
        'created_at': new_task.created_at.isoformat(),
        'task_list_id': new_task.task_list_id
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """
    API endpoint to update an existing task.
    Expects JSON data with 'title', 'description', and/or 'completed' status.
    """
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return jsonify({'error': 'Task title cannot be empty'}), 400
        task.title = title
    
    if 'description' in data:
        task.description = data['description'].strip()
    
    if 'completed' in data:
        task.completed = bool(data['completed'])
    
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'completed': task.completed,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'task_list_id': task.task_list_id
    })

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """
    API endpoint to delete a specific task.
    """
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/tasks/<int:task_id>/toggle', methods=['POST'])
def toggle_task(task_id):
    """
    API endpoint to toggle the completion status of a task.
    """
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'id': task.id,
        'completed': task.completed,
        'updated_at': task.updated_at.isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)
