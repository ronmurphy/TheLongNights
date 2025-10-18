/**
 * 🐈‍⬛ Tutorial to Sargem Parser
 * Converts tutorialScripts.json format to Sargem node-based format
 */

export class TutorialToSargemParser {
    /**
     * Convert tutorialScripts.json to Sargem nodes + connections
     * @param {object} tutorialData - The loaded tutorialScripts.json data
     * @returns {object} - {nodes: [], connections: []}
     */
    static convertToNodes(tutorialData) {
        const nodes = [];
        const connections = [];
        let nodeId = 0;
        let connectionId = 0;

        // Layout config
        const startX = 100;
        const startY = 100;
        const spacing = 200;
        let currentY = startY;

        // Process each tutorial
        const tutorials = tutorialData.tutorials || {};
        Object.keys(tutorials).forEach((tutorialKey, tutorialIndex) => {
            const tutorial = tutorials[tutorialKey];
            const messages = tutorial.messages || [];

            // Create starting position for this tutorial chain
            let currentX = startX;
            currentY = startY + (tutorialIndex * spacing);

            // Create nodes for each message in the tutorial
            let previousNode = null;
            messages.forEach((message, messageIndex) => {
                const node = {
                    id: nodeId++,
                    type: 'dialogue',
                    name: this.generateNodeName(tutorial, messageIndex),
                    x: currentX + (messageIndex * spacing),
                    y: currentY,
                    data: {
                        text: message.text,
                        delay: message.delay || 0,
                        // Metadata from tutorial
                        tutorialId: tutorial.id,
                        trigger: tutorial.trigger,
                        once: tutorial.once !== false
                    }
                };

                nodes.push(node);

                // Connect to previous node
                if (previousNode) {
                    connections.push({
                        id: connectionId++,
                        fromId: previousNode.id,
                        toId: node.id,
                        label: '' // Auto-advance
                    });
                }

                previousNode = node;
            });
        });

        return { nodes, connections };
    }

    /**
     * Generate a readable node name from tutorial data
     */
    static generateNodeName(tutorial, messageIndex) {
        const title = tutorial.title || tutorial.id;
        const shortTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
        return `${shortTitle} [${messageIndex + 1}]`;
    }

    /**
     * Convert Sargem nodes back to tutorialScripts.json format
     * @param {array} nodes - Sargem nodes
     * @param {array} connections - Sargem connections
     * @returns {object} - tutorialScripts.json format
     */
    static convertFromNodes(nodes, connections) {
        const tutorials = {};

        // Group nodes by tutorialId
        const nodesByTutorial = {};
        nodes.forEach(node => {
            const tutorialId = node.data.tutorialId || 'unknown';
            if (!nodesByTutorial[tutorialId]) {
                nodesByTutorial[tutorialId] = [];
            }
            nodesByTutorial[tutorialId].push(node);
        });

        // Convert each tutorial group
        Object.keys(nodesByTutorial).forEach(tutorialId => {
            const tutorialNodes = nodesByTutorial[tutorialId];

            // Sort nodes by connection order (find the chain)
            const sortedNodes = this.sortNodesByConnections(tutorialNodes, connections);

            // Get metadata from first node
            const firstNode = sortedNodes[0];
            const trigger = firstNode.data.trigger || 'onGameStart';
            const once = firstNode.data.once !== false;

            // Extract messages
            const messages = sortedNodes.map(node => ({
                text: node.data.text || '',
                delay: node.data.delay || 0
            }));

            tutorials[tutorialId] = {
                id: tutorialId,
                title: firstNode.name.split('[')[0].trim(), // Remove [1] suffix
                trigger,
                once,
                messages
            };
        });

        return {
            version: '1.0.0',
            description: 'Companion tutorial scripts - exported from Sargem',
            tutorials
        };
    }

    /**
     * Sort nodes by following connection chain
     */
    static sortNodesByConnections(nodes, connections) {
        const sorted = [];
        const nodeMap = {};
        nodes.forEach(n => nodeMap[n.id] = n);

        // Find start node (no incoming connections)
        const hasIncoming = new Set(connections.map(c => c.to));
        const startNode = nodes.find(n => !hasIncoming.has(n.id)) || nodes[0];

        let currentNode = startNode;
        while (currentNode) {
            sorted.push(currentNode);

            // Find next node
            const nextConnection = connections.find(c => c.from === currentNode.id);
            currentNode = nextConnection ? nodeMap[nextConnection.to] : null;
        }

        return sorted;
    }

    /**
     * Create a backup of tutorialScripts.json
     */
    static createBackup(tutorialData) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupKey = `tutorial_backup_${timestamp}`;

        try {
            localStorage.setItem(backupKey, JSON.stringify(tutorialData));
            console.log(`💾 Backup created: ${backupKey}`);
            return backupKey;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    }

    /**
     * List all backups
     */
    static listBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('tutorial_backup_')) {
                const data = localStorage.getItem(key);
                const timestamp = key.replace('tutorial_backup_', '');
                backups.push({
                    key,
                    timestamp,
                    date: new Date(timestamp.replace(/-/g, ':')),
                    size: data.length
                });
            }
        }
        return backups.sort((a, b) => b.date - a.date);
    }

    /**
     * Restore from backup
     */
    static restoreBackup(backupKey) {
        try {
            const data = localStorage.getItem(backupKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to restore backup:', error);
        }
        return null;
    }
}
