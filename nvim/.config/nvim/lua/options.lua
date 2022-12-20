-- illneo general configuration

-- global
local g = vim.g            --global config
local opt = vim.opt        --global opts


-- tabs
opt.shiftwidth = 4
opt.tabstop = 4
opt.smartindent = true


-- general
opt.clipboard = 'unnamedplus' --c/p from clip
opt.swapfile = false
opt.showmatch = true
opt.number = true
opt.splitright = true
opt.splitbelow = true
opt.ignorecase = true
opt.smartcase = true
opt.termguicolors = true
opt.wrap = false
opt.scrolloff = 8

-- nvim-tree
g.loaded_netrw = 1
g.loaded_netrwPlugin = 1

require("nvim-tree").setup()

-- parse and tressitter
require'nvim-treesitter.configs'.setup {
  -- A list of parser names, or "all"
  ensure_installed = { "lua", "javascript", "json", "python" },

  -- Install parsers synchronously (only applied to `ensure_installed`)
  sync_install = false,

  -- Automatically install missing parsers when entering buffer
  -- Recommendation: set to false if you don't have `tree-sitter` CLI installed locally
  auto_install = true,
    -- Setting this to true will run `:h syntax` and tree-sitter at the same time.
    -- Set this to `true` if you depend on 'syntax' being enabled (like for indentation).
    -- Using this option may slow down your editor, and you may see some duplicate highlights.
    -- Instead of true it can also be a list of languages
  additional_vim_regex_highlighting = false,
}
