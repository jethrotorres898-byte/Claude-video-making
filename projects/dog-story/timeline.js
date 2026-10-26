// Shared timeline for anim.js and music.py: scene cuts, every bark (with its tone) and the subtitles.
window.TL = {
  "duration": 56.5,
  "cuts": { "breakup": 7.0, "peek": 17.6, "window": 21.0, "trash": 28.0, "trade": 34.4, "later": 40.6, "lux": 42.6, "busstop": 46.6, "finale": 49.6, "endcard": 54.4 },
  "barks": [
    { "t": 1.3, "type": "whine", "who": "hero", "dur": 1.5 },
    { "t": 4.0, "type": "stomach", "who": "hero", "dur": 1.1 },
    { "t": 7.8, "type": "yip", "who": "ex", "n": 2, "gap": 0.22, "f0": 1000 },
    { "t": 11.0, "type": "huff", "who": "bull" },
    { "t": 12.4, "type": "yip", "who": "ex", "n": 1, "f0": 1100 },
    { "t": 14.4, "type": "howl", "who": "hero", "dur": 2.6 },
    { "t": 19.9, "type": "boof", "who": "hero" },
    { "t": 25.4, "type": "huff", "who": "hero" },
    { "t": 29.0, "type": "grumble", "who": "hero", "dur": 0.8 },
    { "t": 31.5, "type": "bark", "who": "hero", "n": 2, "gap": 0.2, "f0": 470 },
    { "t": 34.9, "type": "growl", "who": "hero", "dur": 1.1 },
    { "t": 36.9, "type": "yip", "who": "hero", "n": 4, "gap": 0.17, "f0": 720 },
    { "t": 43.2, "type": "woof", "who": "hero" },
    { "t": 45.3, "type": "yip", "who": "gf", "n": 1, "f0": 820 },
    { "t": 47.6, "type": "yip", "who": "ex", "n": 2, "gap": 0.14, "f0": 1350 },
    { "t": 52.2, "type": "huff", "who": "hero" }
  ],
  "sfx": [
    { "t": 10.3, "type": "horn" }, { "t": 10.62, "type": "horn" }, { "t": 13.3, "type": "scratch" },
    { "t": 19.2, "type": "boing" }, { "t": 30.65, "type": "splat" }, { "t": 52.0, "type": "ding" }
  ],
  "subs": [
    { "a": 1.3, "b": 3.7, "tone": "sad whimper", "mood": "sad", "text": "Day 1,247 of being a stray." },
    { "a": 4.0, "b": 6.6, "tone": "stomach growls", "mood": "sad", "text": "Haven't eaten since Tuesday." },
    { "a": 7.8, "b": 10.2, "tone": "snobby yip yip", "mood": "snob", "text": "It's not you. It's your empty food bowl." },
    { "a": 11.0, "b": 12.3, "tone": "smug huff", "mood": "smug", "text": "Need a ride, gorgeous?" },
    { "a": 12.4, "b": 13.6, "tone": "dismissive yip", "mood": "snob", "text": "Bye, broke boy." },
    { "a": 14.4, "b": 17.4, "tone": "dramatic howling", "mood": "drama", "text": "WHYYYYYYY" },
    { "a": 19.9, "b": 22.3, "tone": "curious boof?", "mood": "curious", "text": "...wait. People make money from THIS?" },
    { "a": 25.3, "b": 27.9, "tone": "thoughtful huff", "mood": "curious", "text": "Front row. Every night. Well... front window." },
    { "a": 28.8, "b": 30.8, "tone": "determined grumble", "mood": "angry", "text": "Okay. I need a computer." },
    { "a": 31.5, "b": 33.7, "tone": "excited BORK!", "mood": "happy", "text": "JACKPOT!" },
    { "a": 34.9, "b": 36.6, "tone": "low growl", "mood": "angry", "text": "Stick... to... the plan." },
    { "a": 36.9, "b": 38.8, "tone": "happy yips", "mood": "happy", "text": "WE EATING TONIGHT!" },
    { "a": 43.2, "b": 45.1, "tone": "confident WOOF", "mood": "smug", "text": "Who's a good boy now?" },
    { "a": 45.3, "b": 47.0, "tone": "classy yip", "mood": "snob", "text": "Babe, the yacht is waiting." },
    { "a": 47.6, "b": 49.4, "tone": "shocked yelp", "mood": "drama", "text": "Is that... HIM?!" },
    { "a": 52.2, "b": 53.9, "tone": "smug huff", "mood": "smug", "text": "Stay hungry, pups." }
  ]
};
