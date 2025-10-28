#!/bin/bash

# Script de nettoyage complet pour Helia et LevelDB
echo "🧹 Complete cleanup of Helia instances and LevelDB locks..."
echo "=============================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports Helia/IPFS
PORTS=(4001 4002 4003 4004 4005 4006 4007 4008 4009 4010)

echo -e "${BLUE} Step 1: Killing processes on Helia ports...${NC}"
for port in "${PORTS[@]}"; do
    echo "Checking port $port..."
    
    # Utiliser ss au lieu de lsof (plus portable)
    pid=$(ss -tlnp | grep ":$port " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
    
    if [ -n "$pid" ] && [ "$pid" != "" ]; then
        echo -e "  ${YELLOW} Found process $pid using port $port${NC}"
        
        # Obtenir des infos sur le processus
        process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo -e "   Process: $process_info"
        
        # Tuer le processus proprement
        echo -e "  ${RED} Killing process $pid...${NC}"
        kill $pid 2>/dev/null
        
        # Attendre un peu
        sleep 2
        
        # Vérifier si le processus est toujours là
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ${RED} Force killing process $pid...${NC}"
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
        
        echo -e "  ${GREEN} Port $port cleaned${NC}"
    else
        echo -e "  ${GREEN} Port $port is free${NC}"
    fi
    echo
done

echo -e "${BLUE} Step 2: Killing MCP/Helia related processes...${NC}"

# Tuer tous les processus node contenant des mots-clés Helia/MCP
echo "Looking for MCP server processes..."
MCP_PIDS=$(pgrep -f "maieutic-elicitation\|gosseyn.*build/index.js\|mcp.*inspector" 2>/dev/null || true)

if [ -n "$MCP_PIDS" ]; then
    echo -e "${YELLOW} Found MCP processes: $MCP_PIDS${NC}"
    for pid in $MCP_PIDS; do
        process_info=$(ps -p $pid -o args= 2>/dev/null || echo "unknown")
        echo -e "   Process $pid: $(echo $process_info | cut -c1-80)..."
        echo -e "  ${RED} Killing MCP process $pid...${NC}"
        kill $pid 2>/dev/null
        sleep 1
        
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ${RED} Force killing $pid...${NC}"
            kill -9 $pid 2>/dev/null
        fi
    done
    echo -e "${GREEN} MCP processes cleaned${NC}"
else
    echo -e "${GREEN} No MCP processes found${NC}"
fi

# Chercher les processus Helia/IPFS/libp2p
echo "Looking for Helia/IPFS processes..."
HELIA_PIDS=$(pgrep -f "helia\|ipfs\|libp2p" 2>/dev/null || true)

if [ -n "$HELIA_PIDS" ]; then
    echo -e "${YELLOW} Found Helia/IPFS processes: $HELIA_PIDS${NC}"
    for pid in $HELIA_PIDS; do
        echo -e "  ${RED} Killing Helia process $pid...${NC}"
        kill $pid 2>/dev/null
        sleep 1
        
        if kill -0 $pid 2>/dev/null; then
            echo -e "  ${RED} Force killing $pid...${NC}"
            kill -9 $pid 2>/dev/null
        fi
    done
    echo -e "${GREEN} Helia processes cleaned${NC}"
else
    echo -e "${GREEN} No Helia/IPFS processes found${NC}"
fi

echo
echo -e "${BLUE} Step 3: Cleaning LevelDB locks...${NC}"

# Chemins des données LevelDB
LEVELDB_PATHS=(
    "/home/polycrate/projets/data/levelDb/daniel"
    "/home/polycrate/projets/data/levelDb/brigite" 
    "/home/polycrate/projets/data/levelDb/arthur"
    "./data/crypto-trail.db"
    "./data"
)

LOCK_COUNT=0

for path in "${LEVELDB_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "Scanning $path for LOCK files..."
        LOCKS=$(find "$path" -name "LOCK" -type f 2>/dev/null || true)
        
        if [ -n "$LOCKS" ]; then
            echo -e "${YELLOW} Found LOCK files in $path:${NC}"
            echo "$LOCKS" | while read -r lockfile; do
                echo -e "  ${RED} Removing: $lockfile${NC}"
                rm -f "$lockfile"
                LOCK_COUNT=$((LOCK_COUNT + 1))
            done
        else
            echo -e "  ${GREEN} No LOCK files in $path${NC}"
        fi
    else
        echo -e "  ${YELLOW} Path $path does not exist${NC}"
    fi
    echo
done

# Recherche globale des verrous LevelDB SEULEMENT
echo "Global search for remaining LevelDB LOCK files..."
REMAINING_LOCKS=$(find /home/polycrate/projets -name "LOCK" -path "*/levelDb/*" -o -path "*/crypto-trail.db/LOCK" 2>/dev/null || true)

if [ -n "$REMAINING_LOCKS" ]; then
    echo -e "${YELLOW} Found additional LevelDB LOCK files:${NC}"
    echo "$REMAINING_LOCKS" | while read -r lockfile; do
        if [ -f "$lockfile" ]; then
            echo -e "  ${RED} Removing: $lockfile${NC}"
            rm -f "$lockfile"
        fi
    done
else
    echo -e "${GREEN} No additional LevelDB LOCK files found${NC}"
fi

# Nettoyage des répertoires crypto-trail.db vides
echo ""
echo "Cleaning empty crypto-trail.db directories..."
for user_path in "/home/polycrate/projets/data/levelDb/daniel" "/home/polycrate/projets/data/levelDb/brigite" "/home/polycrate/projets/data/levelDb/arthur"; do
    if [ -d "$user_path/crypto-trail.db" ] && [ -z "$(ls -A "$user_path/crypto-trail.db" 2>/dev/null)" ]; then
        echo -e "  ${YELLOW} Removing empty directory: $user_path/crypto-trail.db${NC}"
        rmdir "$user_path/crypto-trail.db" 2>/dev/null || true
    fi
done

echo
echo -e "${BLUE} Step 4: Final status check...${NC}"
echo "=============================================="

echo -e "${BLUE} Port status:${NC}"
for port in "${PORTS[@]}"; do
    if ss -tln | grep -q ":$port "; then
        echo -e "  ${RED} Port $port: OCCUPIED${NC}"
    else
        echo -e "  ${GREEN} Port $port: FREE${NC}"
    fi
done

echo
echo -e "${BLUE} Process status:${NC}"
REMAINING_MCP=$(pgrep -f "maieutic-elicitation\|gosseyn.*build" 2>/dev/null || true)
if [ -n "$REMAINING_MCP" ]; then
    echo -e "  ${RED} MCP processes still running: $REMAINING_MCP${NC}"
else
    echo -e "  ${GREEN} No MCP processes running${NC}"
fi

REMAINING_HELIA=$(pgrep -f "helia\|ipfs\|libp2p" 2>/dev/null || true)
if [ -n "$REMAINING_HELIA" ]; then
    echo -e "  ${RED} Helia processes still running: $REMAINING_HELIA${NC}"
else
    echo -e "  ${GREEN} No Helia processes running${NC}"
fi

echo
echo -e "${BLUE} LevelDB status:${NC}"
REMAINING_LOCKS=$(find /home/polycrate/projets -name "LOCK" -path "*/levelDb/*" -o -path "*/crypto-trail.db/LOCK" 2>/dev/null || true)
if [ -n "$REMAINING_LOCKS" ]; then
    echo -e "  ${RED} Remaining LevelDB LOCK files:${NC}"
    echo "$REMAINING_LOCKS"
else
    echo -e "  ${GREEN} No LevelDB LOCK files found${NC}"
fi

echo
echo -e "${GREEN} Cleanup completed!${NC}"
echo "=============================================="
echo -e "${BLUE} You can now restart your MCP servers${NC}" 