/**
 * Smart Radio Controller
 * Handles music playback, genre display, and AI toggle
 */

const RadioController = {
    isPlaying: false,
    currentGenre: 'Gospel',
    currentArtist: 'Various Artists',
    currentSong: 'Amazing Grace',
    aiEnabled: true,
    genres: ['Gospel', 'R&B Soul', 'Classical'],
    genreIndex: 0,
    audioElement: null,
    currentTrackIndex: 0,
    volume: 1.0, // 0.0 to 1.0
    isMuted: false,
    previousVolume: 1.0, // Store volume before muting
    
    // Music library with royalty-free music URLs
    // You can replace these with your own music files in the 'music' folder
    musicLibrary: {
        'Gospel': [
            { 
                artist: 'Mahalia Jackson', 
                song: 'Amazing Grace',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Placeholder - replace with actual music
            },
            { 
                artist: 'Kirk Franklin', 
                song: 'Love Theory',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
            },
            { 
                artist: 'Aretha Franklin', 
                song: 'Precious Lord',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
            },
            { 
                artist: 'The Clark Sisters', 
                song: 'You Brought the Sunshine',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
            }
        ],
        'R&B Soul': [
            { 
                artist: 'Marvin Gaye', 
                song: 'What\'s Going On',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
            },
            { 
                artist: 'Aretha Franklin', 
                song: 'Respect',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
            },
            { 
                artist: 'Al Green', 
                song: 'Let\'s Stay Together',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
            },
            { 
                artist: 'Otis Redding', 
                song: 'Sitting on the Dock of the Bay',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
            }
        ],
        'Classical': [
            { 
                artist: 'Mozart', 
                song: 'Eine kleine Nachtmusik',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
            },
            { 
                artist: 'Beethoven', 
                song: 'Moonlight Sonata',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
            },
            { 
                artist: 'Bach', 
                song: 'Air on the G String',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
            },
            { 
                artist: 'Vivaldi', 
                song: 'The Four Seasons',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
            }
        ]
    },

    /**
     * Initialize radio
     */
    init() {
        // Get audio element
        this.audioElement = document.getElementById('radioAudio');
        if (this.audioElement) {
            // Set initial volume
            this.audioElement.volume = this.volume;
            
            // Set up audio event listeners
            this.audioElement.addEventListener('ended', () => {
                // When song ends, play next one
                if (this.isPlaying) {
                    this.playNextSong();
                }
            });
            
            this.audioElement.addEventListener('error', (e) => {
                console.log('Audio error:', e);
                // If audio fails to load, just update display without playing
                this.updateDisplay();
            });
        }
        
        this.loadState();
        // Apply loaded volume to audio element
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : this.volume;
        }
        this.updateDisplay();
        this.updateVolumeDisplay();
        this.setGenre(this.currentGenre);
    },

    /**
     * Load radio state from storage
     */
    loadState() {
        const saved = Storage.getRadioState();
        if (saved) {
            this.isPlaying = saved.isPlaying || false;
            this.currentGenre = saved.currentGenre || 'Gospel';
            this.aiEnabled = saved.aiEnabled !== undefined ? saved.aiEnabled : true;
            this.volume = saved.volume !== undefined ? saved.volume : 1.0;
            this.isMuted = saved.isMuted || false;
        }
    },

    /**
     * Save radio state to storage
     */
    saveState() {
        Storage.saveRadioState({
            isPlaying: this.isPlaying,
            currentGenre: this.currentGenre,
            aiEnabled: this.aiEnabled,
            volume: this.volume,
            isMuted: this.isMuted
        });
    },

    /**
     * Toggle play/pause
     */
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        this.updateDisplay();
        this.saveState();
        
        if (this.audioElement) {
            if (this.isPlaying) {
                // If no source is set, load a song
                if (!this.audioElement.src || this.audioElement.src === '') {
                    this.playNextSong();
                } else {
                    // Resume playing
                    this.audioElement.play().catch(err => {
                        console.log('Play error:', err);
                        this.isPlaying = false;
                        this.updateDisplay();
                    });
                }
                this.startAutoAdvance();
            } else {
                // Pause
                this.audioElement.pause();
                this.stopAutoAdvance();
            }
        }
    },

    /**
     * Play next song in current genre
     */
    playNextSong() {
        const songs = this.musicLibrary[this.currentGenre] || [];
        if (songs.length > 0) {
            // Cycle through songs or pick random
            const songIndex = this.currentTrackIndex % songs.length;
            const selectedSong = songs[songIndex];
            this.currentTrackIndex = (this.currentTrackIndex + 1) % songs.length;
            
            this.currentSong = selectedSong.song;
            this.currentArtist = selectedSong.artist;
            
            // Try to load and play the audio
            if (this.audioElement && selectedSong.url) {
                // Try local file first, then fallback to URL
                const localPath = `music/${this.currentGenre}/${selectedSong.song.replace(/\s+/g, '_')}.mp3`;
                
                // Try local file first
                this.audioElement.src = localPath;
                this.audioElement.load();
                
                // If local file fails, try the URL
                this.audioElement.addEventListener('error', function tryUrl() {
                    if (this.src !== selectedSong.url) {
                        this.src = selectedSong.url;
                        this.load();
                        this.removeEventListener('error', tryUrl);
                    }
                }, { once: true });
                
                if (this.isPlaying) {
                    this.audioElement.play().catch(err => {
                        console.log('Play error:', err);
                        // If play fails, just update display
                        this.updateDisplay();
                    });
                }
            }
            
            this.updateDisplay();
            
            if (this.isPlaying) {
                this.startAutoAdvance();
            }
        }
    },

    /**
     * Change genre
     */
    setGenre(genre) {
        if (this.genres.includes(genre)) {
            // Stop current playback if switching genres
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.src = '';
            }
            
            this.currentGenre = genre;
            this.genreIndex = this.genres.indexOf(genre);
            this.currentTrackIndex = 0; // Reset track index for new genre
            
            // If playing, start new genre's music
            if (this.isPlaying) {
                this.playNextSong();
            } else {
                // Just update display
                const songs = this.musicLibrary[this.currentGenre] || [];
                if (songs.length > 0) {
                    this.currentSong = songs[0].song;
                    this.currentArtist = songs[0].artist;
                }
            }
            
            this.updateDisplay();
            this.saveState();
        }
    },

    /**
     * Switch to next genre
     */
    nextGenre() {
        this.genreIndex = (this.genreIndex + 1) % this.genres.length;
        this.setGenre(this.genres[this.genreIndex]);
    },

    /**
     * Switch to previous genre
     */
    previousGenre() {
        this.genreIndex = (this.genreIndex - 1 + this.genres.length) % this.genres.length;
        this.setGenre(this.genres[this.genreIndex]);
    },

    /**
     * Toggle AI on/off
     */
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        this.updateDisplay();
        this.saveState();
        
        // Notify the app
        if (typeof app !== 'undefined') {
            app.onAIStateChange(this.aiEnabled);
        }
    },

    /**
     * Update radio display
     */
    updateDisplay() {
        const genreEl = document.getElementById('radioGenre');
        const artistEl = document.getElementById('radioArtist');
        const songEl = document.getElementById('radioSong');
        const playButtonEl = document.getElementById('radioPlayButton');
        const aiToggleEl = document.getElementById('aiToggle');
        const aiStatusEl = document.getElementById('aiStatus');

        if (genreEl) {
            genreEl.textContent = this.currentGenre;
        }
        if (artistEl) {
            artistEl.textContent = this.currentArtist;
        }
        if (songEl) {
            songEl.textContent = this.currentSong;
        }
        if (playButtonEl) {
            playButtonEl.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
            playButtonEl.className = this.isPlaying ? 'button radio-button playing' : 'button radio-button';
        }
        if (aiToggleEl) {
            aiToggleEl.textContent = this.aiEnabled ? 'AI: ON' : 'AI: OFF';
            aiToggleEl.className = this.aiEnabled ? 'button radio-button ai-on' : 'button radio-button ai-off';
        }
        if (aiStatusEl) {
            aiStatusEl.textContent = this.aiEnabled ? 'AI Assistant Active' : 'AI Assistant Disabled';
            aiStatusEl.className = this.aiEnabled ? 'ai-status active' : 'ai-status inactive';
        }
    },

    /**
     * Auto-advance songs when current song ends
     */
    startAutoAdvance() {
        // Auto-advance is handled by the 'ended' event listener
        // This function is kept for compatibility but doesn't need to do anything
        // since the audio element's 'ended' event will trigger playNextSong()
    },

    /**
     * Stop auto-advance
     */
    stopAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    },

    /**
     * Set volume (0-100)
     */
    setVolume(value) {
        this.volume = parseFloat(value) / 100; // Convert 0-100 to 0.0-1.0
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : this.volume;
        }
        this.updateVolumeDisplay();
        this.saveState();
    },

    /**
     * Toggle mute/unmute
     */
    toggleMute() {
        if (this.isMuted) {
            // Unmute - restore previous volume
            this.isMuted = false;
            if (this.audioElement) {
                this.audioElement.volume = this.volume;
            }
        } else {
            // Mute - save current volume and set to 0
            this.previousVolume = this.volume;
            this.isMuted = true;
            if (this.audioElement) {
                this.audioElement.volume = 0;
            }
        }
        this.updateVolumeDisplay();
        this.saveState();
    },

    /**
     * Update volume display
     */
    updateVolumeDisplay() {
        const volumeDisplay = document.getElementById('volumeDisplay');
        const volumeSlider = document.getElementById('volumeSlider');
        const muteButton = document.getElementById('volumeMuteButton');
        
        if (volumeDisplay) {
            if (this.isMuted) {
                volumeDisplay.textContent = 'Muted';
            } else {
                volumeDisplay.textContent = Math.round(this.volume * 100) + '%';
            }
        }
        
        if (volumeSlider) {
            volumeSlider.value = Math.round(this.volume * 100);
        }
        
        if (muteButton) {
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.title = this.isMuted ? 'Unmute' : 'Mute';
        }
        
        // Apply volume to audio element
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : this.volume;
        }
    }
};

