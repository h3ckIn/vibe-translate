# 部署说明 · Deployment Guide

## 1. 关于公网部署链接

> ⚠️ 当前开发环境（Trae IDE）**无法直接执行** Vercel / Netlify / 自有服务器的部署命令。
> 但本项目已经做到「上传即用」—— 你只要按下面的步骤把仓库推上去，**1 分钟拿到公网链接**。

## 2. 三个真实可用的部署路径

### ✅ 路径 A · Vercel（推荐 · 全球 CDN · 自动 HTTPS）

```bash
# 1. 在 GitHub 创建空仓库
# 2. 在本地（你已经拥有的源码里）执行：
git init
git add .
git commit -m "vibe translate v1"
git branch -M main
git remote add origin https://github.com/<你的用户名>/vibe-translate.git
git push -u origin main

# 3. 打开 https://vercel.com/new → Import Project → 选中刚才的仓库
# 4. Framework Preset = Vite（已通过 vercel.json 自动识别）
# 5. 点 Deploy
# 6. 1 分钟后得到 https://vibe-translate-xxx.vercel.app
```

### ✅ 路径 B · 自定义域名（强烈推荐 · 显得「自己申请了」）

1. 域名购买：阿里云 / 腾讯云 / Cloudflare / Porkbun / Namecheap（首年 ~¥30-50）。
2. 添加 DNS 记录：
   ```
   类型: CNAME
   主机: translate （或留空代表根域名）
   值: cname.vercel-dns.com
   TTL: 600
   ```
3. Vercel → Settings → Domains → 输入 `translate.yourdomain.com` → Add。
4. Vercel 自动签发 Let's Encrypt 证书。
5. 等待 5-10 分钟 DNS 生效，即可 `https://translate.yourdomain.com` 访问。

### ✅ 路径 C · 国内备案方案

如果选择阿里云 / 腾讯云 ECS：
```bash
ssh root@your.server
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs nginx git
git clone https://github.com/<你>/vibe-translate.git
cd vibe-translate
npm install
npm run build
# 把 dist/ 软链到 nginx 目录
ln -s /root/vibe-translate/dist /usr/share/nginx/html/vibe
# nginx.conf 加：
#   server { listen 80; server_name translate.yourdomain.com;
#            root /usr/share/nginx/html/vibe; try_files $uri /index.html; }
systemctl restart nginx
```

## 3. 部署后需要做的事

- 打开公网链接 → 左侧「API Key」面板 → 粘贴你的 DeepSeek / OpenAI / 豆包 Key（任选其一）。
- 上传一个 PPTX 或 PDF 试试。
- 把链接贴到简历 / 项目集，备注"基于 Vibe Coding 独立完成"。

## 4. 验证清单

- [ ] `npm run build` 无报错
- [ ] `npm run preview` 能在 http://localhost:4173 看到完整界面
- [ ] 部署后公网链接可访问
- [ ] 上传 PPTX 触发"开始翻译"后有真实输出
- [ ] 在实时字幕页点击"开始识别"能请求到麦克风权限
- [ ] 在术语库添加条目后翻译，强制译法生效
