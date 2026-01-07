const fs = require('fs');
const filePath = 'c:\\Users\\shyle\\.gemini\\antigravity\\scratch\\global-hunters-association\\global-hunters-association\\src\\components\\LoreModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the double closing brace and garbage await
const garbageRegex = /\s+await updateChatProgress\(activeContact, newState\);\s+};\s+\/\/ Check for 24h wait/;
if (garbageRegex.test(content)) {
    content = content.replace(garbageRegex, '\n\n    // Check for 24h wait');
    console.log('Fixed garbage await and extra closing brace.');
} else {
    console.log('Could not find garbage await with regex.');
    // Fallback: try to find the specific sequence of lines
    const lines = content.split('\n');
    let found = false;
    for (let i = 0; i < lines.length - 3; i++) {
        if (lines[i].includes('await updateChatProgress(activeContact, newState);') &&
            lines[i + 1].trim() === '};' &&
            lines[i + 2].includes('await updateChatProgress(activeContact, newState);') &&
            lines[i + 3].trim() === '};') {
            lines.splice(i + 2, 2);
            content = lines.join('\n');
            found = true;
            console.log('Fixed garbage await and extra closing brace via line matching.');
            break;
        }
    }
}

// 2. Restore the corrupted useEffect
const corruptedEffectRegex = /useEffect\(\(\) => \{\s+if \(isOpen\) \{\s+\/\/ \.\.\. \[Rest of existing load logic\][\s\S]+?setLocalLogs\(initialLogs\);\s+\}\s+\}, \[isOpen, targetProfile\]\);/;
const restoredEffect = `    useEffect(() => {
        if (isOpen) {
            setBio(targetProfile.bio || '');
            setAffinities(targetProfile.affinities || []);
            setClassTags(targetProfile.classTags || []);
            setVideoUrl(targetProfile.videoUrl || '');
            setManagerComment(targetProfile.managerComment || '');
            
            const initialLogs = { ...DEFAULT_LOGS };
            if (targetProfile.missionLogs) {
                Object.assign(initialLogs, targetProfile.missionLogs);
            }
            setLocalLogs(initialLogs);
        }
    }, [isOpen, targetProfile]);`;

if (corruptedEffectRegex.test(content)) {
    content = content.replace(corruptedEffectRegex, restoredEffect);
    console.log('Restored corrupted useEffect.');
} else {
    console.log('Could not find corrupted useEffect with regex.');
}

fs.writeFileSync(filePath, content);
console.log('LoreModal.tsx updated.');
