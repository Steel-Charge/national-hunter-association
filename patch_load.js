const fs = require('fs');
const filePath = 'c:\\Users\\shyle\\.gemini\\antigravity\\scratch\\global-hunters-association\\global-hunters-association\\src\\components\\LoreModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldChunk = `        // Resume existing chat
        const currentNode = chatGraph[progress.currentNodeId];
        setChatHistory(progress.history);
        setIsBlocked(progress.isBlocked || false);
        
        // If we were in the middle of a non-option sequence, we shouldn't be, 
        // because we only save at options or isEnd.
        // But if we are at isEnd and there's a nextId, we might need to trigger typing.
        if (currentNode?.isEnd && currentNode.nextId) {
            setPendingNodeId(currentNode.nextId);
            // We'll let checkProgression handle it if there's a gate.
        } else {
            setPendingNodeId(null);
            setCurrentOptions(currentNode?.options || []);
        }`;

const newChunk = `        // Resume existing chat
        const currentNode = chatGraph[progress.currentNodeId];
        const lastMsgInHistory = progress.history[progress.history.length - 1];
        const hasTextToBeTyped = currentNode?.text && (!lastMsgInHistory || lastMsgInHistory.text !== currentNode.text);

        setChatHistory(progress.history);
        setIsBlocked(progress.isBlocked || false);
        
        if (hasTextToBeTyped) {
            // We need to type this node!
            setPendingNodeId(progress.currentNodeId);
            setIsTyping(true);
            setCurrentOptions([]);
        } else {
            // Check if we reached an end node that now has a satisfied gate
            if (currentNode?.isEnd && currentNode.nextId) {
                setPendingNodeId(currentNode.nextId);
            } else {
                setPendingNodeId(null);
                setCurrentOptions(currentNode?.options || []);
            }
        }`;

if (content.includes(oldChunk)) {
    content = content.replace(oldChunk, newChunk);
    fs.writeFileSync(filePath, content);
    console.log('Successfully patched load logic.');
} else {
    console.log('Failed to find oldChunk. Exact match failed.');
    // Try one more time with a slightly more flexible regex for just the resume part
    const regex = /\/\/ Resume existing chat[\s\S]+?setCurrentOptions\(currentNode\?\.options \|\| \[\]\);\s+\}/;
    if (regex.test(content)) {
        content = content.replace(regex, newChunk);
        fs.writeFileSync(filePath, content);
        console.log('Successfully patched load logic using regex.');
    } else {
        console.log('Fatal: Could not find resume logic.');
        process.exit(1);
    }
}
