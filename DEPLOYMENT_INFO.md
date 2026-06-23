# RoomBridge Deployment Summary

## VPS Information
- **IP Address**: 40.80.92.213
- **OS**: Ubuntu 24.04.4 LTS
- **SSH User**: azureuser / sohail

## Deployment Details

### Website Access
- **URL**: http://40.80.92.213
- **Frontend**: Served via Nginx (port 80)
- **Backend API**: Running on port 5000

### Deployed Folder Structure
```
/home/azureuser/roombridge/
├── roombridge-frontend/    # React frontend (built & served by Nginx)
│   └── dist/               # Production build files
├── roombridge-backend/     # Node.js Express backend
│   ├── server.js
│   ├── package.json
│   ├── .env               # Configured for production
│   └── src/
└── .git/
```

### Running Services

#### 1. **Backend API (PM2 Process Manager)**
- **Name**: roombridge-api
- **Status**: Online
- **Port**: 5000
- **Database**: MongoDB Atlas (roombridge database)
- **Command**: `cd ~/roombridge/roombridge-backend && pm2 start server.js`

#### 2. **Web Server (Nginx)**
- **Status**: Running
- **Configuration**: `/etc/nginx/sites-available/roombridge`
- **Features**:
  - Serves frontend static files
  - Reverse proxy for API requests (`/api` → localhost:5000)
  - WebSocket proxy for Socket.IO (`/socket.io` → localhost:5000)
  - Max file upload: 50MB

#### 3. **Process Management (PM2)**
- **Auto-restart**: Enabled on system reboot
- **Service**: `/etc/systemd/system/pm2-azureuser.service`
- **Commands**:
  - Check status: `pm2 list`
  - View logs: `pm2 logs roombridge-api`
  - Restart: `pm2 restart roombridge-api`

### Configuration Files

#### Backend Environment (`.env`)
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://40.80.92.213
MONGO_URI=mongodb+srv://roombridge:roombridge@roombridge.qgzwjhk.mongodb.net/roombridge
```

#### Nginx Configuration
- **File**: `/etc/nginx/sites-available/roombridge`
- **Root**: `/home/azureuser/roombridge/roombridge-frontend/dist`
- **Proxy Target**: `http://localhost:5000`

## Important Paths

- **Frontend Dist**: `/home/azureuser/roombridge/roombridge-frontend/dist`
- **Backend**: `/home/azureuser/roombridge/roombridge-backend`
- **PM2 Logs**: `/home/azureuser/.pm2/logs/`
- **Nginx Error Log**: `/var/log/nginx/error.log`
- **Nginx Access Log**: `/var/log/nginx/access.log`

## Common Commands

### SSH into VPS
```bash
ssh azureuser@40.80.92.213  # Password: Mubashir@677223
su - sohail                  # Switch to sohail user (password: sohail)
```

### Check Deployment Status
```bash
pm2 list                     # Check running processes
pm2 logs roombridge-api      # View backend logs
sudo tail -20 /var/log/nginx/error.log   # View Nginx errors
curl http://localhost/       # Test frontend
curl http://localhost:5000/api/  # Test API
```

### Restart Services
```bash
pm2 restart roombridge-api   # Restart backend
sudo systemctl reload nginx  # Reload Nginx config
pm2 save                     # Save processes for next boot
```

### Update Code
1. Upload new code to `/home/azureuser/roombridge/`
2. If backend changes: `pm2 restart roombridge-api`
3. If frontend changes: Rebuild and copy to `dist/` folder

## Permissions Set
- **Home directory**: 755 (azureuser: azureuser)
- **Roombridge folder**: 755
- **Frontend dist**: 755
- **Allows Nginx (www-data) to read files**

## Monitoring & Logs

### Backend Logs
```bash
pm2 logs roombridge-api --lines 50
pm2 logs roombridge-api --err  # Error logs only
pm2 logs roombridge-api --out  # Output logs only
```

### Web Server Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Next Steps for Production

1. **SSL/HTTPS**: Install Let's Encrypt certificate
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d 40.80.92.213
   ```

2. **Firewall**: Configure security groups/firewall
   - Allow port 80, 443 for public access
   - Restrict port 5000 to local only

3. **Monitoring**: Set up monitoring and alerting
   - PM2 Plus (pm2.io)
   - Application Performance Monitoring

4. **Database**: Ensure MongoDB backup and security

## Sohail User Account
- **Location**: `/home/sohail`
- **Status**: Accessible for secondary deployment if needed
- **Password**: sohail
- **Current folder**: Empty (`~/roombridge/` is empty)
- **Note**: Main deployment is running under azureuser account

---

**Deployed**: 2026-06-22
**Status**: ✅ Live and accessible at http://40.80.92.213
