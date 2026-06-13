1. [index.html](/Users/ethan/Desktop/repo/minesweeper/index.html:325) 雷在开局时就生成，所以第一次点击可能直接踩雷。扫雷一般会保证首点安全，甚至首点展开一片空白。更好的做法是首次点击后再布雷，并排除第一次点击的位置及其周围。

3. `dataset` 全部存字符串，判断和计算会比较啰嗦。可以考虑维护一个二维数组或一维数组作为棋盘状态，DOM 只负责显示。这样胜负判断、雷数统计、BFS 都会干净很多。

4. [index.html](/Users/ethan/Desktop/repo/minesweeper/index.html:518) 插旗只支持右键，移动端基本不可用。可以加一个“Flag mode”切换按钮，或长按插旗。

5. 输入框 HTML 上限是 100，但 JS 里 `MAX_SIZE = 25`，用户会看到能输到 100，确认后又被改成 25。建议统一，或者 UI 文案提示真实范围。
