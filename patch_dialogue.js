const fs = require('fs');
const filePath = 'c:\\Users\\shyle\\.gemini\\antigravity\\scratch\\global-hunters-association\\global-hunters-association\\src\\components\\LoreModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix handleScreenClick
const oldHandleScreenClick = /const handleScreenClick = async \(\) => \{[\s\S]+?\};/;
const newHandleScreenClick = `const handleScreenClick = async () => {
        if (!isTyping || !pendingNodeId || !activeContact) return;

        const chatGraph = activeContact === 'Rat King' ? RAT_KING_CHAT : BONES_CHAT;
        let node = chatGraph[pendingNodeId];
        if (!node) {
            setIsTyping(false);
            setPendingNodeId(null);
            return;
        }

        // 1. Reveal current pending node
        const newHistory = [...chatHistory];
        if (node.text) {
            newHistory.push({
                sender: node.speaker as any,
                text: node.text,
                audioUrl: node.audioUrl
            });
        }
        setChatHistory(newHistory);
        setIsTyping(false);

        let blocked = isBlocked;
        if (pendingNodeId === 'b_blocked') {
            blocked = true;
            setIsBlocked(true);
        }

        // 2. Decide what's next
        let nextId = node.nextId;
        let nextNode = nextId ? chatGraph[nextId] : null;

        if (nextNode && !nextNode.reqRank && !nextNode.reqTimeWait) {
            // ALWAYS type the next node if it exists and is not gated, even if it has options
            setPendingNodeId(nextId!);
            setTimeout(() => setIsTyping(true), 600);
            setCurrentOptions([]); // Hide options until next node is revealed
            
            // Update Persistence to the node we are ABOUT to type
            const newState: ChatState = {
                currentNodeId: nextId!,
                history: newHistory,
                lastInteractionTime: Date.now(),
                isBlocked: blocked
            };
            await updateChatProgress(activeContact, newState);
        } else {
            // No next sequence, or gated node
            setPendingNodeId(nextId || pendingNodeId);
            setCurrentOptions(node.options || []);
            
            // Persistence stays on the revealed node (or the gated one)
            const newState: ChatState = {
                currentNodeId: nextId || pendingNodeId,
                history: newHistory,
                lastInteractionTime: Date.now(),
                isBlocked: blocked
            };
            await updateChatProgress(activeContact, newState);
        }
    };`;

// 2. Fix Load Effect
const oldLoadEffect = /useEffect\(\(\) => \{[\s\S]+?progress.isBlocked \|\| false;[\s\S]+?if \(currentNode\?\.isEnd[\s\S]+?\}, \[activeContact, currentUser, updateChatProgress\]\);/;
const newLoadEffect = `useEffect(() => {
        if (!activeContact || !currentUser) return;

        const chatGraph = activeContact === 'Rat King' ? RAT_KING_CHAT : BONES_CHAT;
        const progress = currentUser.settings.chatProgress?.[activeContact];

        if (!progress) {
            // First time initialization - start NPC typing
            setChatHistory([]);
            setCurrentOptions([]);
            setIsBlocked(false);
            setPendingNodeId('root');
            setIsTyping(true);
            return;
        }

        // Resume existing chat
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
                // Progression effect will pick it up
            } else {
                setPendingNodeId(null);
                setCurrentOptions(currentNode?.options || []);
            }
        }

    }, [activeContact, currentUser, updateChatProgress]);`;

content = content.replace(oldHandleScreenClick, newHandleScreenClick);
content = content.replace(oldLoadEffect, newLoadEffect);

fs.writeFileSync(filePath, content);
console.log('Successfully patched LoreModal.tsx');
