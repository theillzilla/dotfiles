require('ill_status')
return require('packer').startup(function()
    use 'wbthomason/packer.nvim'
    use {
      'nvim-telescope/telescope.nvim', tag = '0.1.0',
      requires = { {'nvim-lua/plenary.nvim'} }
    }
    use {
      'nvim-treesitter/nvim-treesitter',
      run = function()
      local ts_update = require('nvim-treesitter.install').update({ with_sync = true })
      ts_update()
    end,
    }
	use 'folke/tokyonight.nvim'
	use "EdenEast/nightfox.nvim"
	use {'nvim-orgmode/orgmode', config = function()
 		require('orgmode').setup{}
		end
	}
	use 'feline-nvim/feline.nvim'
	use {
  		'nvim-tree/nvim-tree.lua',
 		 requires = {
    		'nvim-tree/nvim-web-devicons', -- optional, for file icons
  		},
  			tag = 'nightly' -- optional, updated every week. (see issue #1193)
	}
	use { 'nvim-telescope/telescope-fzf-native.nvim', run = 'make', cond = vim.fn.executable 'make' == 1 }
	use {
 	 'VonHeikemen/lsp-zero.nvim',
  		requires = {
    	-- LSP Support
    	{'neovim/nvim-lspconfig'},
    	{'williamboman/mason.nvim'},
    	{'williamboman/mason-lspconfig.nvim'},

    	-- Autocompletion
    	{'hrsh7th/nvim-cmp'},
    	{'hrsh7th/cmp-buffer'},
    	{'hrsh7th/cmp-path'},
    	{'saadparwaiz1/cmp_luasnip'},
    	{'hrsh7th/cmp-nvim-lsp'},
    	{'hrsh7th/cmp-nvim-lua'},

    	-- Snippets
    	{'L3MON4D3/LuaSnip'},
    	{'rafamadriz/friendly-snippets'},
  		}
	}
end)
