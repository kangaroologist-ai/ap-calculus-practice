#!/bin/zsh
# 双击运行：建立班级（已有则跳过）、添加学生、打开打印用的纸条页。
# 姓名和登录码只写进 accounts-private/，不进 git。
# 测试用：ACCOUNTS_LOCAL=1 改为本机测试数据库；ACCOUNTS_OUT=<目录> 改输出目录，且不打开浏览器。

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "${0:A:h}/.." || exit 1

PRIVATE="${ACCOUNTS_OUT:-$HOME/Documents/20_Study/AP Calculus/accounts-private}"
OPTS=(--out "$PRIVATE")
[[ "$ACCOUNTS_LOCAL" == "1" ]] && OPTS+=(--local)

finish() {
  echo
  read -r "?按回车关闭这个窗口。"
  exit "${1:-0}"
}

echo "== 建立班级并添加学生 =="
echo

classes=$(npm run -s accounts -- list $OPTS < /dev/null 2>&1)
if (( $? != 0 )); then
  echo "$classes"
  echo
  read -r "answer?连不上线上数据库。如果是还没登录 Cloudflare，输入 y 现在登录："
  [[ "$answer" == [yY] ]] || finish 1
  npx wrangler login || finish 1
  classes=$(npm run -s accounts -- list $OPTS < /dev/null 2>&1) || { echo "$classes"; finish 1; }
fi
echo "现有班级："
echo "$classes"
echo

while true; do
  read -r "prefix?班级前缀（2–8 个英文字母，例如 CALC）："
  prefix=${(U)prefix// /}
  [[ "$prefix" =~ ^[A-Z]{2,8}$ ]] && break
  echo "前缀只能是 2–8 个英文字母，请重新输入。"
done

if print -r -- "$classes" | grep -q "^$prefix  "; then
  echo "班级 $prefix 已经存在，直接添加学生。"
else
  read -r "classname?班级名称（例如 AP Calculus AB 2026）："
  [[ -z "$classname" ]] && classname="$prefix"
  npm run -s accounts -- create-class "$prefix" "$classname" $OPTS < /dev/null || finish 1
fi
echo

mkdir -p "$PRIVATE" && chmod 700 "$PRIVATE"
echo "学生名单：把名单文件（每行一个姓名）拖进这个窗口，再按回车。"
read -r "names?直接按回车则新建一个名单，用文本编辑打开："
# A dragged file arrives as an escaped path with a trailing space.
names=$(print -r -- "$names" | sed -e 's/[[:space:]]*$//' -e "s/^'//" -e "s/'\$//" -e 's/\\\(.\)/\1/g')
if [[ -z "$names" ]]; then
  names="$PRIVATE/names-$prefix.txt"
  [[ -f "$names" ]] || : > "$names"
  chmod 600 "$names"
  open -e "$names"
  echo "已打开 $names"
  read -r "?每行写一个姓名，保存（⌘S）后回到这里按回车。"
fi
if [[ ! -s "$names" ]]; then
  echo "名单文件不存在或是空的：$names"
  finish 1
fi

out=$(npm run -s accounts -- add-students "$prefix" "$names" $OPTS < /dev/null 2>&1)
code=$?
echo "$out"
(( code == 0 )) || finish 1

slips=$(print -r -- "$out" | sed -n 's/^Wrote .* slips to //p' | tail -1)
if [[ -n "$slips" && -f "$slips" && -z "$ACCOUNTS_OUT" ]]; then
  echo
  echo "正在用浏览器打开纸条页；按 ⌘P 打印，沿虚线剪开发给学生。"
  open "$slips"
fi
echo "纸条页和姓名－登录码表都在 $PRIVATE"
finish 0
