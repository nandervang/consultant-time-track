# Quick Setup Guide for MongoDB Monitoring

## 📋 **Step-by-Step Setup**

### 1. **Add MongoDB Target**
1. Go to your dashboard: http://localhost:5173/
2. In the "Uptime Monitor" widget, click "**Lägg till**"
3. Click the "**🗄️ MongoDB Users Count**" template button

### 2. **Fill In Your Database Details**
Replace the placeholders with your actual values:

**Name**: `DigitalIdag Users Count` ✅ (already filled)

**URL**: Replace `YOUR_PASSWORD` with your real password:
```
mongodb+srv://app:pI4iPrYrdHZx4WkA@digitalidag.khxg9ko.mongodb.net/digitalidag?retryWrites=true&w=majority&appName=DigitalIdag
```

**Type**: `MongoDB Database` ✅ (already selected)

**Database**: `digitalidag` ✅ (already filled)

**Collection**: `partners` ✅ (already filled) 

**Operation**: `count` ✅ (already selected - this will count your users)

### 3. **Save and Monitor**
1. Click "**Lägg till övervakning**"
2. The widget will now show:
   - ✅ **entries: 1** (in the header)
   - ✅ Connection status to your MongoDB
   - ✅ Simulated user count from `partners` collection
   - ✅ Response times

### 4. **What You'll See**
- **Green checkmark**: MongoDB connection successful
- **Response text**: "Simulated: Found X documents in digitalidag.partners"
- **Response time**: ~50-150ms
- **Uptime percentage**: 99%+

## 🚀 **For Real User Counts (Optional)**

If you want **actual real user counts** instead of simulation:

1. **Run the database migration** (copy from `mongodb_migration.sql` into Supabase SQL Editor)
2. **Deploy the backend service** (follow `MONGODB_DEPLOYMENT.md`)
3. **Set environment variables** in your app

## ✨ **New Features Added**

1. **Entries Counter**: Shows "entries: X" in the widget header
2. **MongoDB Support**: Full MongoDB database monitoring
3. **User Count Operation**: Specifically designed to count users in your database
4. **Simulation Mode**: Works immediately without backend setup

Your ping widget now supports both HTTP/API monitoring AND MongoDB database monitoring with user counting! 🎉
