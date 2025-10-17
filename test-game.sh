#!/bin/bash

# Quick test script for The Long Nights v0.2.7

cd /home/brad/Documents/The Long Nights-1/The Long Nights-1-vite/dist-electron

echo "🎮 The Long Nights v0.2.7 - Font Fix Edition"
echo "========================================"
echo ""
echo "Available builds:"
echo "  1) Windows Portable (Wine)"
echo "  2) Linux AppImage (Native)"
echo "  3) Exit"
echo ""
read -p "Select build to test (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🍷 Launching Windows portable with Wine..."
        echo "   Look for:"
        echo "   ✅ Loading screen text"
        echo "   ✅ Game menu text"
        echo "   ✅ UI buttons text"
        echo ""
        wine The Long Nights-0.2.7-portable.exe
        ;;
    2)
        echo ""
        echo "🐧 Launching Linux AppImage..."
        chmod +x The Long Nights-0.2.7.AppImage
        ./The Long Nights-0.2.7.AppImage
        ;;
    3)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
