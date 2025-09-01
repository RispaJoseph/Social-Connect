# 🌐 SocialConnect

**SocialConnect** is a full-stack social media platform where users can connect, share posts.  
It features a modern **React + TypeScript** frontend and a **Django REST Framework** backend with JWT authentication.

---

## 🚀 Features

### 👤 User
- Secure **JWT-based authentication** (login, register, password reset, email verification, forgot password).
- Profile management (edit/update, avatar upload).
- Follow / unfollow system.

### 📌 Posts
- Create, update, and delete posts.
- Like & unlike posts.
- Comment functionality.

### 💬 Notifications
- Notifications for likes, comments, follows.

### 🛡️ Admin
- Manage users and delete posts.
- View total stats for posts and users.

---

## 🏗️ Project Structure

socialconnect/
│── backend/ # Django project settings
│── accounts/ # User authentication & profiles
│── adminpanel/ # Admin features
│── posts/ # Post, likes, comments, reports
│── notifications/ # Notifications system
│── frontend/ # React + TypeScript frontend
│── manage.py # Django entrypoint
│── requirements.txt # Python dependencies
│── package.json # Frontend dependencies
│── .env # Environment variables


---

## ⚙️ Tech Stack

**Backend:** Django REST Framework, PostgreSQL, JWT  
**Frontend:** React + TypeScript, Vite, Tailwind CSS  
**Storage:** Supabase  
**Deployment:** Render (backend), Netlify (frontend)  

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/socialconnect.git
cd socialconnect
```

### 2. Backend Setup (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup (React + TS)
cd frontend
npm install
npm run dev
```

