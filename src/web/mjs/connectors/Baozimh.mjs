import Connector from "../engine/Connector.mjs";
import Manga from "../engine/Manga.mjs";

export default class Baozimh extends Connector {

    constructor() {
        super();
        super.id = "baozimh";
        super.label = "包子漫書 (baozimh)";
        this.tags = ["manga", "webtoon", "chinese"];
        this.url = "https://www.baozimh.com";
    }

    async _getMangaFromURI(uri) {
        const request = new Request(uri, this.requestOptions);
        const data = await this.fetchDOM(request, ".comics-detail__title"); //title object
        const id = uri.pathname;
        let title = data[0].textContent.trim();
        return new Manga(this, id, title);
    }

    async _getMangas() {
        let msg = 'This website provides a manga list that is to large to scrape, please copy and paste the URL containing the images directly from your browser into HakuNeko.';
        throw new Error(msg);
    }

    async _getChapters(manga) {
        let request = new Request(new URL(manga.id, this.url), this.requestOptions);
        //where can it find the chapters
        const data = await this.fetchDOM(request, ".l-box #chapter-items > div > a, .l-box #chapters_other_list > div > a");
        let chapters = data.reverse(); //get first chapters on top
        return chapters.map((element) => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim(),
            };
        });
    }

    async _getPages(chapter) {
        let pagesList = [];
        let pagesList2 = [];
        let data2 = ''
        let uri = new URL(chapter.id, this.url);
        const sectionSlot = uri.searchParams.get('section_slot');
        const chapterSlot = uri.searchParams.get('chapter_slot');
        const linkRegex = new RegExp(`/${sectionSlot}_${chapterSlot}.*\\.html?$`, 'i');
        let run = true;
        while(run) {
            const request = new Request(uri, this.requestOptions);
            let data = await this.fetchDOM(request, '.comic-contain amp-img.comic-contain__item, div:not(.chapter-main) > div.next_chapter a');
            if (data[data.length - 1].tagName.toLowerCase() === 'a') {
                uri = this.getRootRelativeOrAbsoluteLink(data.pop(), this.url);
                if (!uri || uri.match(linkRegex) == null) {
                    uri = null;
                }
            } else {
                uri = null;
            }
            data2 = data[data.length - 1].getAttribute('src');
            pagesList2.push(data2);

            run = uri != null;
        }
        // let result = data2.substr(0, data2.lastIndexOf("/"));
        const lastArray = pagesList2[pagesList2.length -1 ];
        const ur2 = data2.substr(0, data2.lastIndexOf('/')+1);
        const maxCount = data2.substr(data2.lastIndexOf('/') +1).split('.jpg')[0];
        console.log(lastArray);
        for (let i = 1; i < maxCount; i++) {
            console.log(`${ur2}${i}.jpg`);
            pagesList.push(`${ur2}${i}.jpg`);
        }
        return pagesList.filter((page, index) => {
            return index === pagesList.findIndex(item => page === item);
        });
    }
}
