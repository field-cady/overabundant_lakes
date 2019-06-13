# Update the scraped data and the timestamp of last scrape
python scraper.py

# push cahnges to GitHub, where they will be automatically live
git commit -a -m "update on $(date)"
git push
