# 🚀 Render & MongoDB Atlas Deployment Guide

This guide details how to deploy the **Library Management & Book Lending System** to **Render** using **MongoDB Atlas**.

---

## 1. MongoDB Atlas Configuration

### A. Your Generated Connection String
Using your credentials:
- **Username**: `sagar01krcodes_db_user`
- **Password**: `123456789Sagar`
- **Database Name**: `library-management`

Your complete MongoDB Atlas URI:
```env
mongodb+srv://sagar01krcodes_db_user:123456789Sagar@cluster0.xuku8fx.mongodb.net/library-management?retryWrites=true&w=majority
```

> **Important Note on Cluster Host:**
> If your Atlas cluster has a unique cluster suffix (e.g. `cluster0.abcde.mongodb.net` instead of just `cluster0.mongodb.net`), find it in your **Atlas Dashboard** under **Deployment → Database → Connect → Drivers** and copy the host portion between `@` and `/library-management`.

---

### B. Network Access (Crucial Step)
To allow Render and your local machine to connect to your Atlas cluster:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. In the left navigation, click **Security → Network Access**.
3. Click **+ Add IP Address**.
4. Select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Confirm**.

---

## 2. Deploy to Render

### Option A: 1-Click Blueprint (Recommended)
The repository includes [render.yaml](file:///Users/sagarkumar_07/Desktop/Assignement%2002/render.yaml).

1. Push your latest code to your **GitHub** repository.
2. Go to [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml`.
6. When prompted for `MONGODB_URI`, paste your Atlas URI:
   ```text
   mongodb+srv://sagar01krcodes_db_user:123456789Sagar@cluster0.mongodb.net/library-management?retryWrites=true&w=majority
   ```
7. Click **Apply**. Render will build and deploy your app!

---

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `library-management-system`
   - **Region**: `Singapore` or `Oregon`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   | Key | Value |
   |:---|:---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://sagar01krcodes_db_user:123456789Sagar@cluster0.mongodb.net/library-management?retryWrites=true&w=majority` |
   | `SESSION_SECRET` | *(Generate a secure random string or use 64-char string)* |
   | `LOAN_DURATION_DAYS` | `14` |
   | `MAX_ACTIVE_LOANS` | `5` |
   | `DAILY_FINE_RATE` | `5` |
5. Click **Create Web Service**.

---

## 3. Seed Initial Demo Data on Atlas

Once connected to MongoDB Atlas, seed the 20 catalogue books and demo admin/member accounts:

### From Your Local Terminal:
With the Atlas URI in your local `.env`, run:
```bash
npm run seed
```

### From Render Shell:
In Render Dashboard → Your Web Service → **Shell**:
```bash
npm run seed
```

Default seeded credentials:
- **Admin**: `admin@example.com` / `Admin@123`
- **Member**: `john@example.com` / `Member@123`
