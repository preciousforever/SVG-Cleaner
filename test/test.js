var _ = require('underscore')
  , fs = require('fs')
  , expect = require('expect.js')
  , cheerio = require('cheerio')
  , SVGCleaner = require('../')
  ;

describe('SVGCleaner', function() {

  var simpleSvg = fs.readFileSync('test/files/simple.svg', 'utf-8');
  
  before(function() {

  });

  describe('Removal of Namespaced Elements', function() {

    it('should be tested against a file that contains a namespaced element', function() {
      expect(cheerio(simpleSvg).find('#base')[0].name).to.eql('sodipodi:namedview');
    });

    it('should remove namespace elements', function() {
      var cleanedSVG = SVGCleaner.clean(simpleSvg);
      expect(cheerio(cleanedSVG).find('sodipodi:namedview')).to.have.length(0);
    });

  });

  describe('Removal of namespaced Attributes', function() {

    it('should be tested against a file that contains a namespaced attributes', function() {
      expect(cheerio(simpleSvg).find('[inkscape:label]').length).to.be.above(0);
    });

    it('should remove namespace attributes', function() {
      var cleanedSVG = SVGCleaner.clean(simpleSvg);
      expect(cheerio(cleanedSVG).find('[inkscape:label]')).to.have.length(0);
    });
  });

  describe('Removal of comments', function() {

    it('should remove all comments', function() {

      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!-- comment --><svg> \
                  <!-- comment --> \
                  <g style="font-family: Arial;"> \
                    <!-- comment --> \
                  </g> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg);
      expect(cleanedSVG).not.to.match(/<!-- comment -->/);
    });

  });

  describe('Style Repair', function() {

    it('should fix remove color definition when fill or stroke refrences an url', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="fill:url(#test) rgb(0,0,0); stroke:url(#test) rgb(0,0,0);" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.equal('fill:url(#test);stroke:url(#test);');
    });

    it('should remove stroke- and fill-styles, when opacity is 0', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="opacity:0;fill:#0000ff;fill-rule:evenodd;stroke:#000000;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.equal('opacity:0;');
    });

    it('should remove stroke- and fill-styles, when stroke or fill is none', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="fill:none;fill-rule:evenodd;stroke:none;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.equal('fill:none;stroke:none;');
    });

    it('should remove stroke- and fill-styles, when stroke- or fill-opacity is 0', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg>\
                    <rect style="fill:#000000;fill-rule:evenodd;fill-opacity:0;stroke:#000000;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:0" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.equal('fill-opacity:0;stroke-opacity:0;');
    });

    it('should remove stroke-styles, when stroke-with is 0', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="stroke:#000000;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1;stroke-width:0" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.equal('stroke-width:0;');
    });

    it('should remove text-styles, if element does not contain text', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="font-family:Arial;font-style:bold" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.be(undefined);
    });

    it('should keep text-styles, if element could contain text', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                  <g style="font-family: Arial;"> \
                    <text>Hello World</text> \
                    <rect width="10" height="10" /> \
                  </g> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('g').attr("style")).to.equal('font-family: Arial;');
    });

    it('should remove styles with vendor prefix', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="-inkscape-font-specification:tbd;" /> \
                </svg>';
      var cleanedSVG = SVGCleaner.clean(svg, {styleToAttributes: false});
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.be(undefined);
    });

    it('should convert styles to attributes', function() {
      var svg = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg> \
                    <rect style="fill:#000000;" /> \
                </svg>';
      console.log("CONVERT");
      var cleanedSVG = SVGCleaner.clean(svg);
      console.log(cleanedSVG);
      expect(cheerio.load(cleanedSVG)('rect').attr("style")).to.be(undefined);
      expect(cheerio.load(cleanedSVG)('rect').attr("fill")).to.equal('#000000');
    });

  });

});