// Flat key → string map. Keep keys grouped by feature with a dot prefix.
// When adding a key here, mirror it in ja.ts so type-safety stays tight.
export const en = {
  // ----- App-wide -----
  'app.cancel': 'Cancel',
  'app.apply': 'Apply',
  'app.confirm': 'OK',
  'app.delete': 'Delete',
  'app.rename': 'Rename...',

  // ----- Settings drawer -----
  'settings.title': 'Settings',
  'settings.color_mode': 'Color Mode',
  'settings.color_mode.system': 'System',
  'settings.color_mode.light': 'Light',
  'settings.color_mode.dark': 'Dark',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.language.en': 'English',
  'settings.language.ja': '日本語 (Japanese)',
  'settings.danger_zone': '⚠️ Danger Zone',
  'settings.reset_db': 'Reset Database',
  'settings.reset_db_desc': 'Clears all table data (cells, sheets, workbooks) stored in memory.',
  'settings.reset_db_confirm':
    'Are you sure you want to reset the database? This will delete all table data (cells, sheets). This action cannot be undone.',
  'settings.reset_redux': 'Reset Redux State',
  'settings.reset_redux_desc':
    'Clears dirty state, tabs, and auto-save settings. Page will reload.',
  'settings.reset_redux_confirm': 'Are you sure you want to reset Redux state? Page will reload.',
  'settings.reset_all': 'Reset Everything',
  'settings.reset_all_desc': 'Complete reset: database + state + settings. Page will reload.',
  'settings.reset_all_button': 'Reset All Data',
  'settings.reset_all_confirm':
    'Reset everything? Database, state, and settings will all be cleared. Page will reload.',

  // ----- Toolbar tabs -----
  'toolbar.tab.home': 'Home',
  'toolbar.tab.insert': 'Insert',
  'toolbar.tab.draw': 'Draw',
  'toolbar.tab.formulas': 'Formulas',
  'toolbar.tab.data': 'Data',
  'toolbar.tab.view': 'View',

  // ----- Toolbar tooltips (Home) -----
  'toolbar.bold': 'Bold (Ctrl+B)',
  'toolbar.italic': 'Italic (Ctrl+I)',
  'toolbar.underline': 'Underline (Ctrl+U)',
  'toolbar.text_color': 'Text Color',
  'toolbar.fill_color': 'Fill Color',
  'toolbar.borders_all': 'All Borders',
  'toolbar.borders_outer': 'Outside Borders',
  'toolbar.borders_none': 'No Borders',
  'toolbar.merge': 'Merge cells',
  'toolbar.merge_label': '⊞ Merge',
  'toolbar.unmerge': 'Unmerge cells',
  'toolbar.unmerge_label': '⊟ Unmerge',
  'toolbar.currency': 'Currency ($1,234.56)',
  'toolbar.percent': 'Percent (12.34%)',
  'toolbar.comma': 'Comma (1,234.56)',

  // ----- Toolbar tooltips (Insert) -----
  'toolbar.table': 'Table',
  'toolbar.link': 'Link',

  // ----- Toolbar tooltips (Draw) -----
  'toolbar.draw_select': 'Select',
  'toolbar.draw_pen': 'Pen',
  'toolbar.draw_highlighter': 'Highlighter',
  'toolbar.draw_eraser': 'Eraser',
  'toolbar.draw_spray': 'Spray',

  // ----- Toolbar tooltips (Formulas) -----
  'toolbar.insert_function': 'Insert Function (fx)',
  'toolbar.autosum': 'AutoSum',
  'toolbar.calculate_now': 'Calculate Now',
  'toolbar.financial': 'Financial',
  'toolbar.logical': 'Logical',
  'toolbar.text_category': 'Text',
  'toolbar.date_time': 'Date & Time',
  'toolbar.lookup': 'Lookup & Reference',
  'toolbar.math': 'Math & Trig',

  // ----- Toolbar tooltips (Data) -----
  'toolbar.sort_asc': 'Sort A→Z (ascending)',
  'toolbar.sort_desc': 'Sort Z→A (descending)',
  'toolbar.filter': 'Filter (toggle on selected range)',

  // ----- Toolbar tooltips (View) -----
  'toolbar.freeze_top_row': 'Freeze top row',
  'toolbar.freeze_first_col': 'Freeze first column',
  'toolbar.freeze_top_row_label': 'Row',
  'toolbar.freeze_first_col_label': 'Col',
  'toolbar.unfreeze': 'Unfreeze',
  'toolbar.unfreeze_label': 'Reset',
  'toolbar.gridlines': 'Show gridlines',
  'toolbar.gridlines_label': 'Lines',

  // ----- Snackbar messages from container -----
  'msg.select_cell_first': 'Please select a cell first',
  'msg.recalculated': 'Recalculated',
  'msg.range_sorted_asc': 'Range sorted in ascending order',
  'msg.range_sorted_desc': 'Range sorted in descending order',
  'msg.select_range_to_sort': 'Please select a range to sort',
  'msg.table_styled': 'Applied table formatting',
  'msg.select_range_for_table': 'Please select a range to format as a table',
  'msg.merge_done': 'Cells merged',
  'msg.select_range_to_merge': 'Please select a range to merge',
  'msg.unmerge_done': 'Unmerged cells',
  'msg.filter_set': 'Filter applied (click ▼ on a header)',
  'msg.filter_cleared': 'Filter cleared',
  'msg.select_range_for_filter': 'Please select a range to filter',
  'msg.replaced_count': 'Replaced {count} occurrence(s)',
  'msg.sheet_added': 'Added sheet "{name}"',
  'msg.sheet_renamed': 'Renamed sheet to "{name}"',
  'msg.sheet_deleted': 'Sheet deleted',
  'msg.sheet_duplicate_name': 'A sheet with that name already exists',
  'msg.sheet_cant_delete_last': 'Cannot delete the last sheet',

  // ----- Prompts (window.prompt) -----
  'prompt.function_name': 'Enter a function name (e.g. SUM, IF, VLOOKUP)',
  'prompt.link_url': 'Enter the link URL',
  'prompt.link_label': 'Display text (optional)',
  'prompt.sheet_rename': 'New sheet name',
  'prompt.sheet_delete_confirm': 'Delete sheet "{name}"?',

  // ----- Find / Replace panel -----
  'find.search_placeholder': 'Search...',
  'find.replace_placeholder': 'Replace with...',
  'find.replace': 'Replace',
  'find.replace_all': 'Replace all',
  'find.toggle_replace': 'Toggle replace',
  'find.no_results': '0 found',
  'find.position': '{current} / {total}',

  // ----- Cell context menu -----
  'menu.cut': 'Cut (Ctrl+X)',
  'menu.copy': 'Copy (Ctrl+C)',
  'menu.paste': 'Paste (Ctrl+V)',
  'menu.clear': 'Clear (Delete)',
  'menu.insert_row_above': 'Insert row above',
  'menu.insert_row_below': 'Insert row below',
  'menu.insert_col_left': 'Insert column left',
  'menu.insert_col_right': 'Insert column right',
  'menu.delete_row': 'Delete row {n}',
  'menu.delete_col': 'Delete column {n}',
  'menu.hide_row': 'Hide row',
  'menu.hide_col': 'Hide column',
  'menu.show_all_rows': 'Show all rows',
  'menu.show_all_cols': 'Show all columns',

  // ----- Sheet tab menu -----
  'sheet.add': 'Add sheet',
  'sheet.rename': 'Rename...',
  'sheet.delete': 'Delete',

  // ----- Filter popover -----
  'filter.value_search_placeholder': 'Search values...',
  'filter.select_all': '(Select all)',
  'filter.blank': '(Blank)',
  'filter.no_match': 'No matches',

  // ----- Activity bar -----
  'activity.excel_explorer': 'Excel Explorer',
  'activity.source_control': 'Source Control',
  'activity.settings': 'Settings',

  // ----- Workspace header -----
  'header.gridpark': 'Gridpark',
  'header.undo': 'Undo (Cmd+Z)',
  'header.redo': 'Redo (Cmd+Shift+Z)',
  'header.search': 'Search',
  'header.export_as': 'Export (Save As)',
  'header.save': 'Save',
  'header.save_tooltip': 'Save (Ctrl+S)',
  'header.no_changes': 'No changes to save',
  'header.autosave': 'AutoSave',
  'header.autosave_state': 'AutoSave: {state}',
  'header.autosave_on': 'On',
  'header.autosave_off': 'Off',

  // ----- Workbook tabs -----
  'tabs.close_tab': 'Close tab',

  // ----- Formula bar -----
  'formula_bar.name_box': 'Name Box',
  'formula_bar.cancel': 'Cancel (Esc)',
  'formula_bar.confirm': 'Confirm (Enter)',
  'formula_bar.insert_function': 'Insert Function',
  'formula_bar.search_formulas': 'Search formulas...',

  // ----- Misc UI -----
  'editor.empty_state': 'Open a sheet from the file tree.',
  'placeholder.coming_soon': 'Coming Soon',
  'modal.close': 'Close modal',
  'sidebar.explore': 'Explore',
  'sidebar.no_files_match': 'No files match "{query}"',
  'sidebar.open_file': 'Open File…',
  'sidebar.open_file_hint': 'Open an Excel file to get started.',
} as const;

export type TranslationKey = keyof typeof en;
