import type { TranslationKey } from './en';

export const ja: Record<TranslationKey, string> = {
  // ----- App-wide -----
  'app.cancel': 'キャンセル',
  'app.apply': '適用',
  'app.confirm': 'OK',
  'app.delete': '削除',
  'app.rename': '名前を変更...',

  // ----- Settings drawer -----
  'settings.title': '設定',
  'settings.color_mode': 'カラーモード',
  'settings.color_mode.system': 'システム',
  'settings.color_mode.light': 'ライト',
  'settings.color_mode.dark': 'ダーク',
  'settings.theme': 'テーマ',
  'settings.language': '言語',
  'settings.language.en': 'English',
  'settings.language.ja': '日本語',
  'settings.danger_zone': '⚠️ 危険な操作',
  'settings.reset_db': 'データベースをリセット',
  'settings.reset_db_desc': 'メモリ上の表データ (セル, シート, ワークブック) をすべて削除します。',
  'settings.reset_db_confirm':
    'データベースをリセットしますか? すべての表データ (セル, シート) が削除されます。この操作は取り消せません。',
  'settings.reset_redux': 'Redux 状態をリセット',
  'settings.reset_redux_desc':
    'ダーティ状態, タブ, 自動保存設定をクリアし、ページを再読み込みします。',
  'settings.reset_redux_confirm': 'Redux 状態をリセットしますか? ページが再読み込みされます。',
  'settings.reset_all': 'すべてリセット',
  'settings.reset_all_desc': '完全リセット: データベース + 状態 + 設定。ページを再読み込みします。',
  'settings.reset_all_button': 'すべてのデータをリセット',
  'settings.reset_all_confirm':
    'すべてリセットしますか? データベース・状態・設定がすべて消去され、ページが再読み込みされます。',

  // ----- Toolbar tabs -----
  'toolbar.tab.home': 'ホーム',
  'toolbar.tab.insert': '挿入',
  'toolbar.tab.draw': '描画',
  'toolbar.tab.formulas': '数式',
  'toolbar.tab.data': 'データ',
  'toolbar.tab.view': '表示',

  // ----- Toolbar tooltips (Home) -----
  'toolbar.bold': '太字 (Ctrl+B)',
  'toolbar.italic': '斜体 (Ctrl+I)',
  'toolbar.underline': '下線 (Ctrl+U)',
  'toolbar.text_color': '文字色',
  'toolbar.fill_color': '塗りつぶし色',
  'toolbar.borders_all': '全罫線',
  'toolbar.borders_outer': '外枠罫線',
  'toolbar.borders_none': '罫線なし',
  'toolbar.merge': 'セルを結合',
  'toolbar.merge_label': '⊞ 結合',
  'toolbar.unmerge': 'セル結合を解除',
  'toolbar.unmerge_label': '⊟ 解除',
  'toolbar.currency': '通貨 ($1,234.56)',
  'toolbar.percent': 'パーセント (12.34%)',
  'toolbar.comma': '桁区切り (1,234.56)',

  // ----- Toolbar tooltips (Insert) -----
  'toolbar.table': 'テーブル',
  'toolbar.link': 'リンク',

  // ----- Toolbar tooltips (Draw) -----
  'toolbar.draw_select': '選択',
  'toolbar.draw_pen': 'ペン',
  'toolbar.draw_highlighter': '蛍光ペン',
  'toolbar.draw_eraser': '消しゴム',
  'toolbar.draw_spray': 'スプレー',

  // ----- Toolbar tooltips (Formulas) -----
  'toolbar.insert_function': '関数を挿入 (fx)',
  'toolbar.autosum': 'オート SUM',
  'toolbar.calculate_now': '再計算',
  'toolbar.financial': '財務',
  'toolbar.logical': '論理',
  'toolbar.text_category': '文字列',
  'toolbar.date_time': '日付/時刻',
  'toolbar.lookup': '検索/行列',
  'toolbar.math': '数学/三角',

  // ----- Toolbar tooltips (Data) -----
  'toolbar.sort_asc': '昇順 (A→Z)',
  'toolbar.sort_desc': '降順 (Z→A)',
  'toolbar.filter': 'フィルター (範囲を選択して切替)',

  // ----- Toolbar tooltips (View) -----
  'toolbar.freeze_top_row': '先頭行を固定',
  'toolbar.freeze_first_col': '先頭列を固定',
  'toolbar.freeze_top_row_label': '行',
  'toolbar.freeze_first_col_label': '列',
  'toolbar.unfreeze': '固定を解除',
  'toolbar.unfreeze_label': '解除',
  'toolbar.gridlines': '枠線を表示',
  'toolbar.gridlines_label': '枠線',

  // ----- Snackbar messages -----
  'msg.select_cell_first': 'まずセルを選択してください',
  'msg.recalculated': '再計算しました',
  'msg.range_sorted_asc': '範囲を昇順に並べ替えました',
  'msg.range_sorted_desc': '範囲を降順に並べ替えました',
  'msg.select_range_to_sort': '並べ替える範囲を選択してください',
  'msg.table_styled': 'テーブルとして書式設定しました',
  'msg.select_range_for_table': 'テーブル化する範囲を選択してください',
  'msg.merge_done': 'セルを結合しました',
  'msg.select_range_to_merge': '範囲を選択してください',
  'msg.unmerge_done': 'セル結合を解除しました',
  'msg.filter_set': 'フィルターを設定しました (ヘッダの▼をクリック)',
  'msg.filter_cleared': 'フィルターを解除しました',
  'msg.select_range_for_filter': 'フィルターをかける範囲を選択してください',
  'msg.replaced_count': '{count} 件を置換しました',
  'msg.sheet_added': 'シート「{name}」を追加しました',
  'msg.sheet_renamed': 'シート名を「{name}」に変更しました',
  'msg.sheet_deleted': 'シートを削除しました',
  'msg.sheet_duplicate_name': '同名のシートが既に存在します',
  'msg.sheet_cant_delete_last': '最後のシートは削除できません',

  // ----- Prompts -----
  'prompt.function_name': '関数名を入力 (例: SUM, IF, VLOOKUP)',
  'prompt.link_url': 'リンク先 URL を入力',
  'prompt.link_label': '表示テキスト (省略可)',
  'prompt.sheet_rename': '新しいシート名',
  'prompt.sheet_delete_confirm': 'シート「{name}」を削除しますか?',

  // ----- Find / Replace panel -----
  'find.search_placeholder': '検索...',
  'find.replace_placeholder': '置換後...',
  'find.replace': '置換',
  'find.replace_all': 'すべて置換',
  'find.toggle_replace': '置換を表示',
  'find.no_results': '0 件',
  'find.position': '{current} / {total}',

  // ----- Cell context menu -----
  'menu.cut': '切り取り (Ctrl+X)',
  'menu.copy': 'コピー (Ctrl+C)',
  'menu.paste': '貼り付け (Ctrl+V)',
  'menu.clear': 'クリア (Delete)',
  'menu.insert_row_above': '行を上に挿入',
  'menu.insert_row_below': '行を下に挿入',
  'menu.insert_col_left': '列を左に挿入',
  'menu.insert_col_right': '列を右に挿入',
  'menu.delete_row': '行 {n} を削除',
  'menu.delete_col': '列 {n} を削除',
  'menu.hide_row': '行を非表示',
  'menu.hide_col': '列を非表示',
  'menu.show_all_rows': 'すべての行を再表示',
  'menu.show_all_cols': 'すべての列を再表示',

  // ----- Sheet tab menu -----
  'sheet.add': 'シートを追加',
  'sheet.rename': '名前を変更...',
  'sheet.delete': '削除',

  // ----- Filter popover -----
  'filter.value_search_placeholder': '値を検索...',
  'filter.select_all': '(すべて選択)',
  'filter.blank': '(空白)',
  'filter.no_match': '該当なし',

  // ----- Activity bar -----
  'activity.excel_explorer': 'Excel エクスプローラー',
  'activity.source_control': 'ソース管理',
  'activity.settings': '設定',

  // ----- Workspace header -----
  'header.gridpark': 'Gridpark',
  'header.undo': '元に戻す (Cmd+Z)',
  'header.redo': 'やり直し (Cmd+Shift+Z)',
  'header.search': '検索',
  'header.export_as': '名前を付けて書き出し',
  'header.save': '保存',
  'header.save_tooltip': '保存 (Ctrl+S)',
  'header.no_changes': '保存する変更はありません',
  'header.autosave': '自動保存',
  'header.autosave_state': '自動保存: {state}',
  'header.autosave_on': 'オン',
  'header.autosave_off': 'オフ',

  // ----- Workbook tabs -----
  'tabs.close_tab': 'タブを閉じる',

  // ----- Formula bar -----
  'formula_bar.name_box': '名前ボックス',
  'formula_bar.cancel': 'キャンセル (Esc)',
  'formula_bar.confirm': '確定 (Enter)',
  'formula_bar.insert_function': '関数を挿入',
  'formula_bar.search_formulas': '関数を検索...',

  // ----- Misc UI -----
  'editor.empty_state': 'ファイルツリーからシートを開いてください。',
  'placeholder.coming_soon': '近日公開',
  'modal.close': 'モーダルを閉じる',
  'sidebar.explore': 'エクスプローラー',
  'sidebar.no_files_match': '「{query}」に一致するファイルはありません',
  'sidebar.open_file': 'ファイルを開く…',
  'sidebar.open_file_hint': 'Excelファイルを開いてください。',
};
