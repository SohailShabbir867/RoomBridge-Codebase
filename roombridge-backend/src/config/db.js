const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  try {
    console.log("Connecting to database...");
    
    // Attempt standard connection first
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // 5s timeout to trigger fallback quickly if blocked
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`   Database: ${conn.connection.name}`);
      setupEvents();
      return;
    } catch (srvError) {
      const isDnsError = srvError.message.includes("queryTxt") || 
                         srvError.message.includes("querySrv") || 
                         srvError.message.includes("ENOTFOUND") || 
                         srvError.message.includes("ETIMEOUT");
      
      if (isDnsError && mongoUri && mongoUri.startsWith("mongodb+srv://")) {
        console.warn("⚠️  SRV/TXT DNS lookup failed (common on local/tethered networks).");
        console.log("🔄 Attempting automatic conversion to direct connection string...");
        
        // Parse credentials and host from standard mongodb+srv URI
        const match = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)?/);
        if (match) {
          const [, username, password, host, dbAndOptions] = match;
          const dbName = dbAndOptions ? dbAndOptions.split("?")[0] : "";
          
          // Force Google DNS resolver just for SRV resolution (which is often blocked by local ISPs)
          const resolver = new dns.Resolver();
          resolver.setServers(["8.8.8.8", "8.8.4.4"]);
          
          const srvHost = `_mongodb._tcp.${host}`;
          const addresses = await new Promise((resolve, reject) => {
            resolver.resolveSrv(srvHost, (err, addrs) => {
              if (err) reject(err);
              else resolve(addrs);
            });
          });
          
          if (addresses && addresses.length > 0) {
            const hostsList = addresses.map(addr => `${addr.name}:${addr.port}`).join(",");
            const optionsPart = dbAndOptions && dbAndOptions.includes("?") ? dbAndOptions.substring(dbAndOptions.indexOf("?")) : "";
            
            // Build standard direct connection string
            let directUri = `mongodb://${username}:${password}@${hostsList}/${dbName}${optionsPart}`;
            if (!directUri.includes("ssl=")) {
              directUri += (directUri.includes("?") ? "&" : "?") + "ssl=true";
            }
            if (!directUri.includes("authSource=")) {
              directUri += "&authSource=admin";
            }
            
            console.log("🔗 Connecting via direct URI fallback...");
            const conn = await mongoose.connect(directUri, {
              serverSelectionTimeoutMS: 15000,
            });
            console.log(`✅ MongoDB Connected (Fallback): ${conn.connection.host}`);
            console.log(`   Database: ${conn.connection.name}`);
            setupEvents();
            return;
          }
        }
      }
      throw srvError;
    }
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

const setupEvents = () => {
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected.");
  });
};

module.exports = connectDB;
