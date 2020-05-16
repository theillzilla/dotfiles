" vim plug
call plug#begin('~/.local/share/nvim/plugged')
Plug 'preservim/nerdtree'
Plug 'tpope/vim-surround'
Plug 'mxw/vim-jsx'
Plug 'jiangmiao/auto-pairs'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'tpope/vim-fugitive'
Plug 'junegunn/seoul256.vim'
Plug 'vimwiki/vimwiki'
call plug#end()

" colors
colo seoul256
" line nums
:set number
:set tw=120

" vim-jsx syntax stuff
let g:jsx_ext_required = 0

" airline stuff
let g:airline#extensions#ale#enabled = 1
let g:airline_powerline_fonts = 1
let g:airline_theme='deus'

"remove the auto indent
"filetype plugin indent off

" tabs
set tabstop=2
set expandtab

" fix escape
imap jk <Esc>

"key maps
noremap <leader>ev :split $MYVIMRC<cr>
map <C-J> <C-W>j<C-W>_
map <C-K> <C-W>k<C-W>_

"python
let g:python3_host_prog = "/usr/local/bin/python3"

"vim-wiki
set nocompatible
filetype plugin on
syntax on
