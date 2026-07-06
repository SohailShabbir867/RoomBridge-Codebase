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
        
        // Parse credentials and host robustly from mongodb+srv URI (supporting passwords with '@' characters)
        const urlWithoutProtocol = mongoUri.replace("mongodb+srv://", "");
        const lastAtIndex = urlWithoutProtocol.lastIndexOf("@");
        
        if (lastAtIndex !== -1) {
          const credentialsPart = urlWithoutProtocol.substring(0, lastAtIndex);
          const hostAndRest = urlWithoutProtocol.substring(lastAtIndex + 1);
          
          const colonIndex = credentialsPart.indexOf(":");
          if (colonIndex !== -1) {
            const username = credentialsPart.substring(0, colonIndex);
            const password = credentialsPart.substring(colonIndex + 1);
            
            const slashIndex = hostAndRest.indexOf("/");
            let host = hostAndRest;
            let dbAndOptions = "";
            if (slashIndex !== -1) {
              host = hostAndRest.substring(0, slashIndex);
              dbAndOptions = hostAndRest.substring(slashIndex + 1);
            }
            
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
              
              // Build standard direct connection string with URL-encoded credentials
              const encodedUser = encodeURIComponent(username);
              const encodedPass = encodeURIComponent(password);
              let directUri = `mongodb://${encodedUser}:${encodedPass}@${hostsList}/${dbName}${optionsPart}`;
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
