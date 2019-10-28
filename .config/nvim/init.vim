" vim plug
call plug#begin('~/.local/share/nvim/plugged')
Plug 'tpope/vim-surround'
Plug 'dracula/vim'
Plug 'w0rp/ale'
Plug 'mxw/vim-jsx'
Plug 'pangloss/vim-javascript'
Plug 'sheerun/prettier-standard'
Plug 'jiangmiao/auto-pairs'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'tpope/vim-fugitive'
Plug 'scrooloose/nerdcommenter'
Plug 'junegunn/fzf', { 'dir': '~/.fzf', 'do': './install --all' }
if has('nvim')
  Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
else
  Plug 'Shougo/deoplete.nvim'
  Plug 'roxma/nvim-yarp'
  Plug 'roxma/vim-hug-neovim-rpc'
endif
call plug#end()

" colors
syntax on
color dracula
set termguicolors

" line nums
:set number
:set tw=120

" vim-jsx syntax stuff
let g:jsx_ext_required = 0

" standard-prettier
let g:ale_fixers = {'javascript': ['standard']}
let g:ale_linters = {'javascript': ['standard']}
let g:ale_sign_column_alwayus = 1
let g:ale_fix_on_save = 1

" airline stuff
let g:airline#extensions#ale#enabled = 1
let g:airline_powerline_fonts = 1
let g:airline_theme='deus'

"remove the auto indent
filetype plugin indent off

" tabs
set tabstop=2
set expandtab
" deoplete
let g:deoplete#enable_at_startup = 1
inoremap <expr><tab> pumvisible() ? "\<c-n>" : "\<tab>"

" fix escape
imap jk <Esc>

"nerdcommenter
filetype plugin on
let g:NERDSpaceDelims = 1
let g:NERDCoimpactSexyComs = 1
let g:NERDTrimTrailingWhitespace = 1

"key maps
noremap <leader>ev :split $MYVIMRC<cr>
map <C-J> <C-W>j<C-W>_
map <C-K> <C-W>k<C-W>_



