#!/bin/bash

echo "🚀 بدء بناء المشروع..."

# تنظيف المجلدات السابقة
echo "🧹 تنظيف المجلدات السابقة..."
rm -rf build
rm -rf dist

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

# بناء المشروع للإنتاج
echo "🔨 بناء المشروع للإنتاج..."
npm run build

# نسخ ملفات إضافية
echo "📋 نسخ الملفات الإضافية..."
cp public/.htaccess build/
cp public/robots.txt build/
cp public/sitemap.xml build/

echo "✅ تم بناء المشروع بنجاح!"
echo "📁 مجلد البناء: build/"
echo "📊 حجم الملفات:"
du -sh build/*

echo "🎯 جاهز للرفع على Namecheap!" 