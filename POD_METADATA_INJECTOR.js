/**
 * BASICGLITCH | POD METADATA INJECTOR (V1.0)
 * ==========================================
 * INSTRUCTIONS:
 * 1. Open the Redbubble "Add New Work" page.
 * 2. Press F12 to open the Browser Console.
 * 3. Copy and paste THIS ENTIRE SCRIPT into the console and press Enter.
 * 4. To fill a specific design, type: inject('scribe') or inject('broboticus'), etc.
 * ==========================================
 */

const manifest = {
  'scribe': {
    title: "Obsidian Scribe: Desert Tech Noir Bot. Corporate Lies.",
    tags: "Obsidian Scribe, Tech Noir, Forensic Bot, Corporate Lies, Cyberpunk, Dystopian Future, Sci Fi Robot, AI Detective, New Mexico Desert, Future Tech, Justice Seeker, Hacker Theme, Data Crime, Mystery Thriller, Volcanic Glass, Dark Aesthetic, Sci-fi Art, Android, Surveillance, Truth Unveiled",
    desc: "In the desolate expanse of the New Mexico Desert, where forgotten data winds whisper through canyons, stands the Obsidian Scribe. This isn't just any forensic bot; it's a silent sentinel, crafted from volcanic glass and cutting-edge tech noir artistry. Programmed to unearth the truth, the Scribe navigates a dystopian future, meticulously piecing together digital evidence. Its mission: to expose the deepest corporate lies buried beneath layers of deceit. A true AI detective in a cyberpunk landscape, it represents a beacon of justice seeker spirit against corruption and data crime. This sci fi robot embodies the relentless pursuit of truth unveiled, a compelling mystery thriller in metallic and obsidian form. Perfect for fans of future tech and the hacker theme, this sci-fi art design captures the stark beauty and grim purpose of an advanced android. With its dark aesthetic and underlying theme of surveillance, the Obsidian Scribe plunges you into a world where a lone bot holds the key to forgotten futures."
  },
  'broboticus': {
    title: "Cyberpunk Desert Guardian Soul Robot Broboticus Art",
    tags: "cyberpunk,robot,guardian,desert,futuristic,sci-fi,dystopian,sentinel,protector,wasteland,soul-infused,AI robot,cyborg,neon,techwear,post-apocalyptic,digital art,Broboticus,cyberpunk art,future warrior",
    desc: "From the desolate expanse of the high desert emerges Broboticus, the ultimate cyberpunk guardian. This isn't just another robot; he's a formidable, soul-infused sentinel, his metallic frame housing a spirit as ancient as the sand. As a silent protector in a fragmented, dystopian future, Broboticus stands as a testament to resilience, patrolling the unforgiving wasteland against encroaching threats. His presence defines futuristic might, a powerful AI robot whose cyborg enhancements merge seamlessly with his noble purpose. The glow of distant neon signs often reflects off his battle-worn chassis, hinting at a hidden cyberpunk art scene amidst the desolation. With a distinct techwear aesthetic, Broboticus is perfectly equipped for his role as a desert guardian in this stark, post-apocalyptic realm. This sci-fi icon represents the raw spirit of survival, an indispensable beacon of hope amidst the ruin. Dive into the gritty narrative of Broboticus, the last line of defense."
  },
  'traphouse': {
    title: "Trap House Glitch Art Digital Data Cyberpunk Aesthetic",
    tags: "glitch art, cyberpunk, trap house, digital trap, data trap, surreal art, vaporwave, techwear, matrix, error aesthetic, futuristic, sci fi, modern art, abstract art, coding, hacking, dystopian, cyber aesthetic, virtual reality, deep learning",
    desc: "Dive into the unsettling beauty of our 'Literal Trap House' design, a striking piece of glitch art where reality bends and digital data flows. This isn't just a house; it's a common dwelling caught in a mesmerizing digital snare, embodying a true digital trap and data trap. Experience a hauntingly beautiful vision that blends a cyberpunk future with profound surreal art and a distinctive vaporwave sensibility. This design captures the essence of a techwear aesthetic, where the very fabric of the matrix seems to fray, revealing an intriguing error aesthetic. It’s more than just a graphic; it’s a commentary on our increasingly intertwined digital lives, a futuristic vision blending sci fi narratives with modern art and abstract art principles. Perfect for enthusiasts of coding, the thrill of hacking, or the philosophical depth of a dystopian world. Embrace the bold cyber aesthetic and ponder the implications of virtual reality and deep learning in our complex, data-driven existence."
  },
  'sybil': {
    title: "Silicon Sybil: Translucent AI Forensic Bot Cyber Sleuth",
    tags: "AI, Robot, Cyberpunk, Sci-Fi, Detective, Future, Tech Noir, Dystopian, Forensic Bot, Digital Sleuth, Fiber Optic, Translucent, Machine Learning, Investigator, Artificial Intelligence, Silicon Sybil, Neo Noir, Future Tech, Data Analysis, Speculative Fiction",
    desc: "In a future dystopian cityscape, where shadows cling to chrome and neon bleeds into perpetual rain, emerges The Silicon Sybil, a marvel of future tech. This isn't just any robot; she's the ultimate AI forensic bot, a digital sleuth designed to navigate the darkest corners of cyberpunk crime. Her translucent fiber-optic form hums with unseen power, a network of light and data conducting intricate data analysis. As an advanced Artificial Intelligence investigator, she embodies the spirit of speculative fiction, operating beyond the limits of human perception. Every micro-transaction, every shattered data-fragment, falls under her gaze. She's the silent detective, a beacon in the oppressive tech noir world, driven by complex machine learning algorithms. The Silicon Sybil is more than a machine; she's a harbinger of a new era of justice in a fractured future, a true neo noir sentinel against digital darkness. Her presence defines the cutting edge of Sci-Fi law enforcement."
  },
  'warden': {
    title: "Caliche Warden Terraforming Forensic Bot Sci-Fi Robot",
    tags: "Caliche Warden, Terraforming Bot, Forensic Robot, Sci-Fi Robot, Cyberpunk, Futuristic Droid, Tech-Noir, Dystopian Future, Space Exploration, AI Robot, Mecha, Android, Alien Planet, Planetary Warden, Investigation Bot, Heavy Duty Robot, Future Tech, Geologic Forensic, SciFi Art, Robot Detective",
    desc: "Unleash the gritty future with the Caliche Warden design. This **heavy-duty robot** isn't just a machine; it's the ultimate **terraforming bot** and **forensic robot** in a desolate universe. As a silent guardian, the powerful **Caliche Warden** navigates hostile alien landscapes, its advanced sensors scanning for anomalies, uncovering planetary secrets long buried in the dust. Immerse yourself in the captivating **sci-fi robot** aesthetic, blending **cyberpunk** grit with **futuristic droid** precision. This **tech-noir** marvel embodies the spirit of **dystopian future** exploration, where an **AI robot** serves as the last bastion of truth. Whether it's pioneering **space exploration** or a deep dive into an **alien planet**'s tumultuous past, this formidable **mecha** operates as the ultimate **planetary warden**. Perfect for fans of **android** lore, intricate **investigation bot** thrillers, and profound **geologic forensic** mysteries. It’s more than a design; it’s a testament to pioneering **future tech**, portraying a true **robot detective** in the cosmic wild, relentlessly pursuing forgotten data across unforgiving frontiers."
  }
};

function inject(key) {
  const data = manifest[key];
  if (!data) {
    console.error(`Design '${key}' not found. Try: ${Object.keys(manifest).join(', ')}`);
    return;
  }

  // Redbubble Selectors
  const titleField = document.querySelector('#work_title_en') || document.querySelector('input[name*="title"]');
  const tagsField = document.querySelector('#work_tag_field_en') || document.querySelector('textarea[name*="tag"]');
  const descField = document.querySelector('#work_description_en') || document.querySelector('textarea[name*="description"]');

  if (titleField) titleField.value = data.title;
  if (tagsField) tagsField.value = data.tags;
  if (descField) descField.value = data.desc;

  // Trigger input events to notify the site's React/Redux state
  [titleField, tagsField, descField].forEach(field => {
    if (field) field.dispatchEvent(new Event('input', { bubbles: true }));
  });

  console.log(`%c SUCCESS: ${data.title} injected into fields.`, 'background: #222; color: #00ffff; font-weight: bold;');
}

console.log("%c BASICGLITCH INJECTOR LOADED ", 'background: #00ffff; color: #000; font-weight: bold;');
console.log("To inject, type: inject('scribe'), inject('broboticus'), inject('traphouse'), inject('sybil'), or inject('warden')");
