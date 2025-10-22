#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete restoration of TenderDetails.tsx from original UTF-16 backup
"""

import sys
import os
import shutil
from pathlib import Path

def restore_from_backup():
    """Restore clean file from backup or create new one"""
    
    base_path = r'c:\Users\ammn\Desktop\MBM_app\Final_5Sep\Desktop Management System (Community) (Copy) (Copy)'
    target_file = os.path.join(base_path, r'src\presentation\components\bidding\TenderDetails.tsx')
    
    print("🔍 جاري البحث عن ملف احتياطي...")
    
    # List of possible backup locations
    backup_options = [
        os.path.join(base_path, 'TenderDetails_original.tsx'),
        os.path.join(base_path, 'TenderDetails_backup.tsx'),
        os.path.join(base_path, 'temp_tender_details.txt'),
    ]
    
    # Try to find and use a good backup
    for backup in backup_options:
        if os.path.exists(backup):
            print(f"✓ وجدت نسخة احتياطية: {backup}")
            try:
                with open(backup, 'r', encoding='utf-16-le', errors='ignore') as f:
                    content = f.read()
                print(f"✓ تم قراءة النسخة الاحتياطية: {len(content)} حرف")
                
                # Save as UTF-8
                with open(target_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ تم استعادة الملف من النسخة الاحتياطية")
                return True
            except Exception as e:
                print(f"⚠️ فشل القراءة: {e}")
    
    print("❌ لم يتم العثور على نسخة احتياطية صالحة")
    return False

if __name__ == '__main__':
    try:
        if restore_from_backup():
            print("\n✅ اكتملت الاستعادة بنجاح!")
            sys.exit(0)
        else:
            print("\n❌ فشلت الاستعادة")
            sys.exit(1)
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
