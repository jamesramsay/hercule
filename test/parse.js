import test  from 'ava';
import utils from '../lib/utils';


test('should parse simple local links', (t) => {
  t.plan(1);
  let file = "file.md";
  let link = {
    href: file,
    placeholder: `:[simple](${file})`,
    relativePath: "",
  }

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "file.md",
    hrefType: "file",
    placeholder: link.placeholder,
    references: [],
    default: null,
    relativePath: "",
  });
});


test('should parse remote http links', (t) => {
  t.plan(1);
  let url = "http://github.com/example.md";
  let link = {
    href: url,
    placeholder: `:[remote http link](${url})`,
    relativePath: "",
  };

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "http://github.com/example.md",
    hrefType: "http",
    placeholder: link.placeholder,
    references: [],
    default: null,
    relativePath: ""
  });
});

test('should parse complex links', (t) => {
  t.plan(1);
  let mixedLink = "file.md fruit:apple.md header: footer:../common/footer.md copyright:\"Copyright 2014 (c)\"";
  let link = {
    href: mixedLink,
    placeholder: `:[](${mixedLink})`,
    relativePath: "customer/farmers-market"
  };

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "file.md",
    hrefType: "file",
    placeholder: link.placeholder,
    references: [
      {
        placeholder: "fruit",
        hrefType: "file",
        href: "customer/farmers-market/apple.md"
      },
      {
        placeholder: "header",
        hrefType: "string",
        href: ""
      },
      {
        placeholder: "footer",
        hrefType: "file",
        href: "customer/common/footer.md"
      },
      {
        placeholder:"copyright",
        hrefType:"string",
        href:"Copyright 2014 (c)"
      }
    ],
    default: null,
    relativePath: "customer/farmers-market"
  });
});


test('should parse links with default', (t) => {
  t.plan(1);
  let href = "file-which-does-not-exist.md || \"default value\"";
  let link = {
    href: href,
    placeholder: `:[simple](${href})`,
    relativePath: ""
  }

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "file-which-does-not-exist.md",
    hrefType: "file",
    placeholder: link.placeholder,
    references: [],
    default: {
      hrefType: "string",
      href: "default value"
    },
    relativePath: ""
  });
});


test('should parse complex links with default', (t) => {
  t.plan(1);
  let mixedLink = "file.md || \"Nope\" fruit:apple.md header: footer:../common/footer.md copyright:\"Copyright 2014 (c)\""
  let link = {
    href: mixedLink,
    placeholder: `:[](${mixedLink})`,
    relativePath: "customer/farmers-market"
  }

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "file.md",
    hrefType: "file",
    placeholder: link.placeholder,
    references: [
      {
        placeholder: "fruit",
        hrefType: "file",
        href: "customer/farmers-market/apple.md"
      },
      {
        placeholder: "header",
        hrefType: "string",
        href: ""
      },
      {
        placeholder: "footer",
        hrefType: "file",
        href: "customer/common/footer.md"
      },
      {
        placeholder:"copyright",
        hrefType:"string",
        href:"Copyright 2014 (c)"
      }
    ],
    default: {
      hrefType: "string",
      href: "Nope"
    },
    relativePath: "customer/farmers-market"
  });
});


test('should parse links with an empty default', (t) => {
  t.plan(1);
  let href = "file-which-does-not-exist.md || \"\"";
  let link = {
    href: href,
    placeholder: `:[simple](${href})`,
    relativePath: ""
  };

  let parsedLink = utils.parse(link);

  t.same(parsedLink, {
    href: "file-which-does-not-exist.md",
    hrefType: "file",
    placeholder: link.placeholder,
    references: [],
    default: {
      hrefType: "string",
      href: ""
    },
    relativePath: ""
  });
});
