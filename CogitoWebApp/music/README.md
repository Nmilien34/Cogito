# Music Files

To add your own music files to the radio:

## Folder Structure

Create folders for each genre and add your music files:

```
music/
├── Gospel/
│   ├── Amazing_Grace.mp3
│   ├── Love_Theory.mp3
│   └── ...
├── R&B Soul/
│   ├── What's_Going_On.mp3
│   ├── Respect.mp3
│   └── ...
└── Classical/
    ├── Eine_kleine_Nachtmusik.mp3
    ├── Moonlight_Sonata.mp3
    └── ...
```

## File Naming

- Use underscores instead of spaces (e.g., `Amazing_Grace.mp3`)
- Match the song names in `js/radio.js` musicLibrary
- Supported formats: MP3, OGG, WAV

## How It Works

1. The radio first tries to load music from the `music/` folder
2. If a local file isn't found, it falls back to the URL in the code
3. You can replace the URLs in `js/radio.js` with your own music URLs

## Adding Your Own Music

1. Add MP3 files to the appropriate genre folder
2. Name them to match the song names (with underscores)
3. Or update the URLs in `js/radio.js` to point to your music files

