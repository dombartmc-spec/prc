// --- FIREBASE FUNCTIONS ---
async function saveToFirebase() {
    try {
        const data = {
            rounds: state.rounds,
            drivers: state.drivers,
            results: state.results,
            changeLogs: state.changeLogs,
            lastUpdated: new Date().toISOString()
        };
        
        await db.collection('tournament').doc('wrc2025').set(data);
        console.log('Data saved to Firebase');
        return true;
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        // Fallback to localStorage
        saveToLocalStorage();
        return false;
    }
}

async function loadFromFirebase() {
    try {
        const doc = await db.collection('tournament').doc('wrc2025').get();
        
        if (doc.exists) {
            const data = doc.data();
            state.rounds = data.rounds || [];
            state.drivers = data.drivers || [];
            state.results = data.results || [];
            state.changeLogs = data.changeLogs || [];
            
            console.log('Data loaded from Firebase');
            return true;
        } else {
            console.log('No data in Firebase, loading defaults');
            loadDefaultData();
            await saveToFirebase(); // Save defaults to Firebase
            return true;
        }
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        // Fallback to localStorage
        return loadFromLocalStorage();
    }
}

async function saveDriverToFirebase(driver) {
    try {
        // Update in local state first
        const index = state.drivers.findIndex(d => d.id === driver.id);
        if (index !== -1) {
            state.drivers[index] = driver;
        } else {
            state.drivers.push(driver);
        }
        
        // Save entire state to Firebase
        await saveToFirebase();
        return true;
    } catch (error) {
        console.error('Error saving driver:', error);
        return false;
    }
}

async function saveResultToFirebase(result) {
    try {
        // Remove existing result for this driver/stage
        state.results = state.results.filter(r => 
            !(r.r === result.r && r.s === result.s && r.d === result.d)
        );
        
        // Add new result
        state.results.push(result);
        
        // Save to Firebase
        await saveToFirebase();
        return true;
    } catch (error) {
        console.error('Error saving result:', error);
        return false;
    }
}

async function deleteResultFromFirebase(r, s, d) {
    try {
        state.results = state.results.filter(result => 
            !(result.r === r && result.s === s && result.d === d)
        );
        
        await saveToFirebase();
        return true;
    } catch (error) {
        console.error('Error deleting result:', error);
        return false;
    }
}

// Realtime updates
function setupRealtimeUpdates() {
    db.collection('tournament').doc('wrc2025')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                
                // Only update if data is newer
                const localTimestamp = localStorage.getItem('wrc_last_update');
                const remoteTimestamp = data.lastUpdated;
                
                if (!localTimestamp || new Date(remoteTimestamp) > new Date(localTimestamp)) {
                    console.log('Real-time update received');
                    
                    state.rounds = data.rounds || [];
                    state.drivers = data.drivers || [];
                    state.results = data.results || [];
                    state.changeLogs = data.changeLogs || [];
                    
                    // Update local storage as backup
                    saveToLocalStorage();
                    
                    // Refresh all views
                    refreshAllViews();
                    showAdminStatus("Dane zaktualizowane na żywo", false, true);
                }
            }
        }, (error) => {
            console.error('Real-time update error:', error);
        });
}

// --- MODYFIKACJE ISTNIEJĄCYCH FUNKCJI ---

// Zmodyfikuj init do używania Firebase
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase first
    await initializeFirebase();
    
    // Load data from Firebase
    await loadFromFirebase();
    
    // Setup real-time updates
    setupRealtimeUpdates();
    
    // Calculate points
    calculateAllRoundPoints();
    
    // Render views
    renderDriversTable();
    renderConstructorsTable();
    updateLeaders();
    updateTeamAssignments();
    router('home');
    
    // Start leader rotation
    startLeaderRotation();
});

// Zmodyfikuj funkcje zapisu
async function submitAdminResult() {
    // ... (existing validation code) ...
    
    // After validation, save to Firebase
    const success = await saveResultToFirebase({
        r: rIdx,
        s: sIdx,
        d: dId,
        time: timeStr,
        ms: msValue,
        cp: conditionPoints
    });
    
    if (success) {
        showAdminStatus("Zapisano poprawnie");
        refreshAllViews();
        addLog(`Dodano wynik: ${driver?.name || 'Nieznany'} - ${roundName} - ${stageName}: ${timeStr}`, "system");
    }
}

// Podobnie zmodyfikuj inne funkcje zapisu...
