/**
 * BookTheme.js
 *
 * Unified styling system for all Explorer's Journal pages:
 * - World Map
 * - Companion Codex
 * - Vanquished Foes
 *
 * Ensures all three views look like pages in the same book
 */

export const BookTheme = {
    // Main container (outer book cover)
    container: {
        background: 'linear-gradient(135deg, rgba(101, 67, 33, 0.98), rgba(139, 90, 43, 0.98))',
        border: '10px ridge #654321',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)'
    },

    // Left page styling
    leftPage: {
        background: 'linear-gradient(45deg, #F5E6D3, #E8D5B7)',
        border: '3px solid #8B4513',
        borderRadius: '15px 5px 5px 15px',
        padding: '20px',
        boxShadow: 'inset 2px 0 10px rgba(139, 69, 19, 0.3)',
        fontFamily: "'Georgia', serif",
        color: '#4A3728'
    },

    // Right page styling
    rightPage: {
        background: 'linear-gradient(45deg, #E8D5B7, #F5E6D3)',
        border: '3px solid #8B4513',
        borderRadius: '5px 15px 15px 5px',
        padding: '20px',
        boxShadow: 'inset -2px 0 10px rgba(139, 69, 19, 0.3)',
        fontFamily: "'Georgia', serif",
        color: '#4A3728'
    },

    // Book spine (center separator)
    spine: {
        background: 'linear-gradient(180deg, #654321, #8B4513, #654321)',
        borderRadius: '5px',
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
        position: 'relative'
    },

    // Page headers
    header: {
        margin: '0 0 20px 0',
        color: '#4A3728',
        textAlign: 'center',
        fontSize: '24px',
        fontFamily: "'Georgia', serif",
        borderBottom: '2px solid #D4AF37',
        paddingBottom: '10px'
    },

    // Subheaders
    subheader: {
        fontSize: '18px',
        color: '#654321',
        marginBottom: '12px',
        fontFamily: "'Georgia', serif",
        borderBottom: '1px solid #D4AF37'
    },

    // Body text
    bodyText: {
        fontFamily: "'Georgia', serif",
        fontSize: '14px',
        color: '#4A3728',
        lineHeight: '1.6'
    },

    // Golden accent text (for stats, numbers)
    accentText: {
        color: '#D4AF37',
        fontWeight: 'bold',
        fontFamily: "'Georgia', serif"
    },

    // Bookmark tabs
    bookmarks: {
        map: {
            background: 'linear-gradient(90deg, #8B4513, #A0522D)',
            backgroundHover: 'linear-gradient(90deg, #A0522D, #CD853F)',
            border: '3px solid #654321',
            icon: '🗺️'
        },
        codex: {
            background: 'linear-gradient(90deg, #D4AF37, #F4E4A6)',
            backgroundHover: 'linear-gradient(90deg, #F4E4A6, #FFD700)',
            border: '3px solid #654321',
            icon: '📘'
        },
        vanquished: {
            background: 'linear-gradient(90deg, #8B0000, #A52A2A)',
            backgroundHover: 'linear-gradient(90deg, #A52A2A, #DC143C)',
            border: '3px solid #4B0000',
            icon: '💀'
        }
    },

    // Buttons (Set Active, Equip, etc.)
    button: {
        background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4A6 50%, #D4AF37 100%)',
        backgroundActive: 'linear-gradient(135deg, #90EE90 0%, #98FB98 50%, #90EE90 100%)',
        color: '#2C1810',
        border: '3px solid #8B7355',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '16px',
        fontFamily: "'Georgia', serif",
        cursor: 'pointer',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)'
    },

    // List items (companion list, enemy list)
    listItem: {
        background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.2), rgba(244, 228, 166, 0.2))',
        backgroundHover: 'linear-gradient(90deg, rgba(212, 175, 55, 0.4), rgba(244, 228, 166, 0.4))',
        backgroundSelected: 'linear-gradient(90deg, #D4AF37, #F4E4A6)',
        border: '2px solid #D4AF37',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '10px',
        cursor: 'pointer',
        fontFamily: "'Georgia', serif",
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)'
    },

    // Portrait/image frames
    portrait: {
        border: '3px solid #8B4513',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        background: '#F5E6D3'
    },

    // Stats grid
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        fontFamily: "'Georgia', serif",
        fontSize: '14px',
        color: '#4A3728'
    },

    // Modal overlays
    modal: {
        background: 'linear-gradient(135deg, #E8D5B7, #F5E6D3)',
        border: '4px solid #8B4513',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        padding: '30px',
        fontFamily: "'Georgia', serif"
    }
};

/**
 * Helper function to convert theme object to CSS string
 */
export function themeToCSS(themeObj) {
    return Object.entries(themeObj)
        .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value};`;
        })
        .join(' ');
}
