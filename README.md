# **Maxima Hub – AI-Powered Idea Evaluation Platform** 🚀  

This project was built for **IBM Hackathon 2025**, using **Django** for the backend and **Next.js** for the frontend. Maxima Hub helps businesses, investors, and teams evaluate the feasibility of ideas, estimate resources, assign tasks, and predict investment needs.

---

## **Project Structure**  
📂 **ibm-hackerthon-2025**  
├── 📁 **maxima-hub/** → (Frontend - Next.js)  
├── 📁 **backend/** → (Backend - Django)  
└── 📄 **README.md** → (This file)  

---

## **Getting Started**  

### **1. Clone the repository**  
```sh
git clone https://github.com/your-username/ibm-hackerthon-2025.git
cd ibm-hackerthon-2025
```

---

## **Run with Docker 🐳**  

This project is **Dockerized** for easy deployment.

### **1. Build & Start Containers**  
```sh
docker-compose up --build -d
```

This will:
✅ Build the **Django backend**  
✅ Build the **Next.js frontend**  
✅ Start both services and connect them  

### **2. Access the Application**  
- **Frontend:** [http://localhost:3000](http://localhost:3000)  
- **Backend API:** [http://localhost:8000](http://localhost:8000)  

### **3. Stopping the Containers**  
```sh
docker-compose down
```

---

## **Manual Setup (Without Docker)**  

### **Backend Setup (Django)**  

#### **Navigate to the backend folder**  
```sh
cd backend
```

#### **Create a virtual environment & install dependencies**  
```sh
python -m venv env
source env/bin/activate  # On Windows use `env\Scripts\activate`
pip install -r requirements.txt
```

#### **Run migrations & start the server**  
```sh
python manage.py migrate
python manage.py runserver
```

The backend should now be running on **http://127.0.0.1:8000/**.

---

### **Frontend Setup (Next.js)**  

#### **Navigate to the frontend folder**  
```sh
cd ../maxima-hub
```

#### **Install dependencies**  
```sh
npm install
```

#### **Start the frontend**  
```sh
npm run dev
```

The frontend should now be running on **http://localhost:3000/**.

---

## **Environment Variables**  

### **Backend (Django)**
Create a **.env** file inside the `backend/` directory and add:  
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=your-database-url
```

### **Frontend (Next.js)**
Create a **.env.local** file inside the `maxima-hub/` directory and add:  
```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

---

## **API Endpoints (Django Backend)**  

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/idea/` | Submit an idea for evaluation |
| `GET` | `/api/idea/:id/` | Retrieve idea details |
| `POST` | `/api/evaluate/` | Evaluate idea feasibility |
| `POST` | `/api/assign-tasks/` | Assign tasks and roles |

---

## **Features**  
✅ **AI-driven idea evaluation** using IBM Granite models  
✅ **Budget & salary estimation** based on country and complexity  
✅ **Task & role assignment** for execution planning  
✅ **Feasibility scoring & risk analysis**  

---

## **Contributing**  
Want to improve Maxima Hub? Feel free to fork, submit pull requests, or open an issue!  

---

## **License**  
This project is open-source and follows the **MIT License**.  

---

### **Happy Hacking! 🚀**  
