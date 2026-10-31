import json, os, re, sys, time, urllib.parse, urllib.request

OUT = os.path.join("assets", "img", "places")
os.makedirs(OUT, exist_ok=True)
UA = "china-trip-photo-fetch/1.0 (personal travel plan)"

QUERIES = {
    "jiefangbei": "Jiefangbei Chongqing monument",
    "yangtze_cableway": "Yangtze River Cableway Chongqing",
    "nanshan_cq": "Chongqing skyline Nanshan viewpoint",
    "longshuixia": "Longshuixia Wulong",
    "fairy_mountain": "Xiannushan Wulong grassland",
    "yau_ma_tei": "Yau Ma Tei Hong Kong street",
    "temple_street": "Temple Street night market Hong Kong",
    "avenue_of_stars": "Avenue of Stars Hong Kong",
    "central_hk": "Central Mid-Levels escalator Hong Kong",
    "ngong_ping": "Ngong Ping 360 cable car",
    "tai_o": "Tai O stilt houses",
    "mong_kok": "Mong Kok Hong Kong street night",
    "central_harbourfront": "Central Harbourfront Hong Kong",
    "tsim_sha_tsui": "Tsim Sha Tsui promenade skyline",
    "lhasa": "Lhasa city Potala view",
    "potala_palace": "Potala Palace Lhasa",
    "jokhang": "Jokhang Temple Lhasa",
    "barkhor": "Barkhor street Lhasa",
    "sera_monastery": "Sera Monastery Lhasa",
    "norbulingka": "Norbulingka Lhasa",
    "senado_square": "Senado Square Macau",
    "st_pauls": "Ruins of St. Paul's Macau",
    "taipa": "Taipa Macau old village",
    "venetian_macau": "Venetian Macao casino",
    "guia_fortress": "Guia Fortress Macau lighthouse",
    "sai_kung": "Sai Kung Hong Kong harbour",
    "panda_base": "Giant panda Chengdu",
    "sanxingdui": "Sanxingdui museum",
    "fenghuang": "Fenghuang ancient town Tuo river",
    "grand_canyon": "Zhangjiajie Grand Canyon glass bridge",
    "tianmen": "Tianmen Mountain Heaven's Gate Zhangjiajie",
    "guangzhou": "Canton Tower Guangzhou skyline",
    "canton_opera": "Guangzhou Opera House Zaha Hadid",
    "canton_tower": "Canton Tower night Guangzhou",
    "shamian": "Shamian Island Guangzhou",
    "chen_clan": "Chen Clan Ancestral Hall Guangzhou",
    "guilin": "Guilin Li River pagoda",
    "li_river": "Li River karst Guilin landscape",
    "yangshuo": "Yangshuo karst mountains Yulong",
    "west_street": "West Street Yangshuo",
    "yulong_river": "Yulong River bamboo raft Yangshuo",
    "longsheng": "Longji rice terraces Longsheng",
    "shanghai": "Lujiazui skyline Pudong",
    "bund": "The Bund Shanghai promenade",
    "former_french": "Wukang Road Shanghai",
    "tianzifang": "Tianzifang",
    "shanghai_museum": "Power Station of Art Shanghai",
    "suzhou": "Suzhou canal Pingjiang Road",
    "humble_garden": "Humble Administrator's Garden Suzhou",
    "hangzhou": "Hangzhou West Lake pagoda",
    "west_lake": "West Lake Hangzhou",
    "longjing": "Longjing tea plantation Hangzhou",
    "lingyin_temple": "Lingyin Temple Hangzhou",
    "sanya": "Sanya Yalong Bay beach resort",
    "wuzhizhou": "Wuzhizhou Island Hainan",
    "nanshan_sanya": "Guanyin statue Nanshan Sanya",
    "sanyaphx": "Sanya Phoenix International Airport",
}


def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))


def search(query, limit=6):
    data = api({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": "filetype:bitmap " + query, "gsrnamespace": "6",
        "gsrlimit": str(limit), "prop": "imageinfo",
        "iiprop": "url|size|extmetadata", "iiurlwidth": "1200",
    })
    pages = data.get("query", {}).get("pages", {})
    out = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        if not ii.get("thumburl"):
            continue
        meta = ii.get("extmetadata", {})
        out.append({
            "title": p.get("title"),
            "thumb": ii["thumburl"],
            "page": ii.get("descriptionurl"),
            "w": ii.get("width"), "h": ii.get("height"),
            "artist": re.sub("<[^>]+>", "", meta.get("Artist", {}).get("value", ""))[:120],
            "license": meta.get("LicenseShortName", {}).get("value", ""),
        })
    # prefer landscape-ish photos
    out.sort(key=lambda x: -(1.15 <= (x["w"] or 1) / max(x["h"] or 1, 1) <= 1.9))
    return out


def main():
    credits = {}
    if os.path.exists("assets/img/place_credits.json"):
        credits = json.load(open("assets/img/place_credits.json", encoding="utf-8"))
    only = sys.argv[1:]
    for key, q in QUERIES.items():
        if only and key not in only:
            continue
        try:
            res = search(q)
        except Exception as e:
            print("ERR search", key, e)
            continue
        time.sleep(5)
        if not res:
            print("EMPTY", key, q)
            continue
        best = res[0]
        path = os.path.join(OUT, key + ".jpg")
        try:
            req = urllib.request.Request(best["thumb"], headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r, open(path, "wb") as f:
                f.write(r.read())
        except Exception as e:
            print("ERR dl", key, e)
            continue
        credits[key] = {
            "file": path.replace("\\", "/"),
            "page": best["page"],
            "title": best["title"],
            "artist": best["artist"],
            "license": best["license"],
            "query": q,
            "alt": [x["title"] for x in res[1:4]],
        }
        print("OK", key, os.path.getsize(path), best["title"], "|", best["license"], "|", best["artist"][:40])
    json.dump(credits, open("assets/img/place_credits.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
