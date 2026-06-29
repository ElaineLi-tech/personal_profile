# 联系方式加密使用说明

## 方案概览

本项目采用纯静态方案保护微信二维码和手机号，适用于 `GitHub Pages`、`Gitee Pages` 等无后端托管场景。

- 仓库中仅保存 AES 加密后的密文，不保存可直接识别的微信二维码原图或可渲染的 Base64 明文
- 访问者只有通过带 `#k=...` 哈希密钥的专属链接，才会在浏览器本地解密并看到完整联系方式
- URL 的 `#` 片段不会上传到静态托管服务器，也不会参与常规页面请求
- 无密钥或密钥错误时，页面仅展示提示文案和脱敏手机号

## 当前文件说明

- `secure-contact-data.js`
  - 存放加密后的二维码密文、手机号密文、脱敏手机号和校验密文
- `scripts/encrypt-contact.js`
  - 本地离线加密脚本
- `script.js`
  - 前端本地解密逻辑，只在浏览器端执行
- `index.html`
  - 受保护联系方式区域的页面结构

## 本地重新加密步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 准备原始二维码

建议将原始二维码图片放在仓库外部目录，避免误提交到仓库中。例如：

```bash
/Users/your-name/Desktop/wechat-qr.jpg
```

支持格式：

- `.png`
- `.jpg`
- `.jpeg`
- `.gif`
- `.webp`

### 3. 运行加密脚本

```bash
npm run encrypt:contact -- \
  --image /absolute/path/to/wechat-qr.jpg \
  --phone 13800138000 \
  --base-url https://your-github-username.github.io/personal_profile/ \
  --out secure-contact-data.js
```

参数说明：

- `--image`
  - 原始微信二维码图片的绝对路径
- `--phone`
  - 需要保护的完整手机号
- `--base-url`
  - 你的线上页面地址，用于生成专属访问链接
- `--out`
  - 输出密文文件路径，默认就是 `secure-contact-data.js`

### 4. 保存脚本输出的专属链接

脚本执行后会输出一条带哈希密钥的专属链接，格式类似：

```text
https://your-github-username.github.io/personal_profile/#k=随机密钥
```

注意事项：

- 这个 `#k=...` 就是解锁凭证
- 它不会写入仓库源码
- 你需要自行妥善保存并只发给可信任的人
- 如果怀疑泄露，重新运行一次加密脚本即可生成新的密钥和新的密文

### 5. 确认仓库中没有原始二维码

加密完成后，请确保仓库中不存在原始二维码文件，也不要把原始二维码重新拖回项目目录。

可用以下命令自检：

```bash
find . -maxdepth 2 \( -iname '*qr*' -o -iname '*wechat*' -o -iname '*二维码*' \)
```

如果还有原始图片，请删除后再提交。

## 页面访问表现

### 无密钥访问

- 微信二维码不渲染
- 页面只显示解锁提示
- 手机号只显示脱敏形式

### 错误密钥访问

- 页面保持和无密钥时一致
- 不报解密错误
- 不显示完整联系方式

### 正确密钥访问

- 浏览器从 URL 哈希中读取密钥
- 本地解密 `secure-contact-data.js` 中的密文
- 动态渲染二维码图片
- 展示完整手机号并启用 `tel:` 链接

## GitHub Pages 部署步骤

### 1. 推送到 GitHub 仓库

```bash
git add .
git commit -m "Add protected contact encryption flow"
git push
```

### 2. 开启 GitHub Pages

1. 打开 GitHub 仓库
2. 进入 `Settings`
3. 打开 `Pages`
4. 在 `Build and deployment` 中选择：
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` 或你的默认分支
   - `Folder`: `/ (root)`
5. 保存设置

### 3. 获取线上地址

GitHub Pages 成功后会生成类似地址：

```text
https://your-github-username.github.io/personal_profile/
```

### 4. 生成正式专属访问链接

如果你之前在本地测试时使用的是本地地址，请再次运行加密脚本，把 `--base-url` 改成你的 GitHub Pages 正式地址，然后保存新输出的专属链接。

说明：

- 重新加密不是因为部署后密文失效
- 而是为了让脚本输出的专属链接直接指向线上地址，方便你转发给访客

## 安全验证建议

### 1. 源码检查

检查仓库中是否存在以下风险：

- 原始二维码图片
- `data:image/...;base64,` 明文图片内容
- 明文手机号

推荐命令：

```bash
grep -R "data:image/" .
grep -R "13800138000" .
```

请将命令中的手机号替换成你自己的真实号码。

### 2. 浏览器场景测试

分别测试以下三种链接：

- 基础地址：`https://your-github-username.github.io/personal_profile/`
- 错误密钥：`https://your-github-username.github.io/personal_profile/#k=wrong`
- 正确密钥：脚本生成的专属链接

预期：

- 前两者不显示完整联系方式
- 只有最后一个显示完整微信二维码和手机号

### 3. 网络面板检查

打开浏览器开发者工具 `Network` 面板，确认：

- 请求 URL 中没有 `#k=...`
- 请求中没有明文手机号
- 请求中没有明文微信二维码图片地址

## 重要安全说明

- 该方案是“前端本地解密 + 专属链接分发”保护，不是后端身份鉴权
- 任何拿到正确哈希密钥的人，都可以在浏览器中解锁完整联系方式
- 如果专属链接泄露，请立即重新运行加密脚本，生成新的密钥和新的密文，并重新部署
