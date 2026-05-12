"""
models.py
---------
Database models for SafeHorizon using Flask-SQLAlchemy.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

# Initialize the db instance here so it can be imported by app.py
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # index=True speeds up login queries since we search by email
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    
    # Store the hashed password, NEVER plain text
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Automatically records when the user signed up
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Useful if you ever need to ban or deactivate a user
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        """Helper method to safely send user data back to the frontend."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active
        }