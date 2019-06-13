

python scraper.py
echo "\"$(date)\"" > last_update.txt

git commit -a -m "update on $(date)"
git push
