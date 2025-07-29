// Function to generate theme switcher HTML
export function ThemeSwitcher(): string {
  return `
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-sm" data-testid="theme-switcher">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow max-h-96 overflow-y-auto">
        <li><a onclick="setTheme('auto')" data-testid="theme-auto">Auto</a></li>
        <li><a onclick="setTheme('light')" data-testid="theme-light">Light</a></li>
        <li><a onclick="setTheme('dark')" data-testid="theme-dark">Dark</a></li>
        <li><a onclick="setTheme('cupcake')" data-testid="theme-cupcake">Cupcake</a></li>
        <li><a onclick="setTheme('bumblebee')" data-testid="theme-bumblebee">Bumblebee</a></li>
        <li><a onclick="setTheme('emerald')" data-testid="theme-emerald">Emerald</a></li>
        <li><a onclick="setTheme('corporate')" data-testid="theme-corporate">Corporate</a></li>
        <li><a onclick="setTheme('synthwave')" data-testid="theme-synthwave">Synthwave</a></li>
        <li><a onclick="setTheme('retro')" data-testid="theme-retro">Retro</a></li>
        <li><a onclick="setTheme('cyberpunk')" data-testid="theme-cyberpunk">Cyberpunk</a></li>
        <li><a onclick="setTheme('valentine')" data-testid="theme-valentine">Valentine</a></li>
        <li><a onclick="setTheme('halloween')" data-testid="theme-halloween">Halloween</a></li>
        <li><a onclick="setTheme('garden')" data-testid="theme-garden">Garden</a></li>
        <li><a onclick="setTheme('forest')" data-testid="theme-forest">Forest</a></li>
        <li><a onclick="setTheme('aqua')" data-testid="theme-aqua">Aqua</a></li>
        <li><a onclick="setTheme('lofi')" data-testid="theme-lofi">Lofi</a></li>
        <li><a onclick="setTheme('pastel')" data-testid="theme-pastel">Pastel</a></li>
        <li><a onclick="setTheme('fantasy')" data-testid="theme-fantasy">Fantasy</a></li>
        <li><a onclick="setTheme('wireframe')" data-testid="theme-wireframe">Wireframe</a></li>
        <li><a onclick="setTheme('black')" data-testid="theme-black">Black</a></li>
        <li><a onclick="setTheme('luxury')" data-testid="theme-luxury">Luxury</a></li>
        <li><a onclick="setTheme('dracula')" data-testid="theme-dracula">Dracula</a></li>
        <li><a onclick="setTheme('cmyk')" data-testid="theme-cmyk">CMYK</a></li>
        <li><a onclick="setTheme('autumn')" data-testid="theme-autumn">Autumn</a></li>
        <li><a onclick="setTheme('business')" data-testid="theme-business">Business</a></li>
        <li><a onclick="setTheme('acid')" data-testid="theme-acid">Acid</a></li>
        <li><a onclick="setTheme('lemonade')" data-testid="theme-lemonade">Lemonade</a></li>
        <li><a onclick="setTheme('night')" data-testid="theme-night">Night</a></li>
        <li><a onclick="setTheme('coffee')" data-testid="theme-coffee">Coffee</a></li>
        <li><a onclick="setTheme('winter')" data-testid="theme-winter">Winter</a></li>
        <li><a onclick="setTheme('dim')" data-testid="theme-dim">Dim</a></li>
        <li><a onclick="setTheme('nord')" data-testid="theme-nord">Nord</a></li>
        <li><a onclick="setTheme('sunset')" data-testid="theme-sunset">Sunset</a></li>
      </ul>
    </div>
  `
}