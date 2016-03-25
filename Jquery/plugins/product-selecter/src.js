require("./src.css");
var $template = $(require("./src.html"));
var levelNum = 0;
function handleBinder(action, elems, func, delay) {
    var timer = null;
    elems.bind(action, function () {
        timer && clearTimeout(timer);
        timer = setTimeout(func, delay);
    });
}
//ProductTips
var ProductTips = function () {
    this.template = $template.filter(".product-selecter-tips");
    this.input;
    this.noInput;
    this.onComplated;
    this.isShow = false;
    this.cache = {};

    var _this = this;
    this.template.delegate("li", "click", function (event) {
        var $li = $(event.currentTarget);
        var data = $li.data("data");
        _this.setVal(data.name);
        _this.noInput.val(data.no);
        _this.hide();
    });
    this.template.delegate("li", "mouseover", function () {
        _this.template.children().removeClass("hover");
        $(this).addClass("hover");
    });
    this.template.delegate("li", "mouseout", function () { $(this).removeClass("hover"); });
    $(document).bind("click.ProductTips", function (event) {
        if (_this.input) {
            if (_this.isShow) {
                if (_this.input.is(event.target) || _this.template.is(event.target) || _this.template.has(event.target).length) {
                    return;
                }
                var val = _this.getVal();
                if (val) {
                    var def = _this.cache[val];
                    if (def) {
                        def.done(function (data) {
                            if (data.data.items && data.data.items.length > 0) {
                                var first = data.data.items[0];
                                var firstName = first.name.replace(/<[^]+?>/g, '');
                                if (_this.getVal() == firstName) {
                                    _this.noInput.val(first.no);
                                }
                            }
                        });
                    }
                }
                _this.onComplated && _this.onComplated();
                _this.hide();
            } else {
                _this.onComplated && _this.onComplated();
            }
        } 
    })
}
ProductTips.prototype.bind = function (nameInput, noInput, onComplated) {
    if (this.input) {
        if (this.input.is(nameInput)) return;
        this.input.off(".tips");
    }
    this.onComplated = onComplated || $.noop;
    var _this = this;
    this.input = $(nameInput);
    this.noInput = $(noInput);
    this.template.width(this.input.outerWidth());
    handleBinder("keyup.tips", this.input, function () {
        _this.search();
    }, 200);
    if(!this.noInput.val())
        this.search();
}
ProductTips.prototype.getVal = function () {
    return $.trim(this.input.val());
}
ProductTips.prototype.setVal = function (name) {
    this.input.val(name.replace(/<[^]+?>/g, ''));
    this.onComplated();
}
ProductTips.prototype.search = function () {
    this.noInput && this.noInput.val('');
    this.hide();
    if (!this.input) return;
    var val = this.getVal();
    if (!val || val.length < 2) return;
    var _this = this;
    var def = this.cache[val];
    if(!def)
        def = this.cache[val] = $.ajax({
            url: "http://api.search.tgnet.com/Api/ProductClass?mp=false&high=true&count=50&kw=" + encodeURIComponent(val),
            type: "get",
            dataType: "jsonp",
            error: function () { delete _this.cache[val]; }
        });
    def.done(function (data) {
        var currentVal = _this.getVal();
        if (currentVal == val) {
            var d = data.data;
            _this.template.empty();
            if (d.items && d.items.length > 0) {
                for (var i = 0; i < d.items.length; i++) {
                    _this.template.append($("<li/>").html(d.items[i].name).data("data", d.items[i]).attr("title", d.items[i].full_name.replace(/<[^]+?>/g, '').replace(/\//g, '\\')));//{name,no,full_name}
                }
                if (d.items.length > 1 || currentVal != d.items[0].name || _this.noInput.val() != d.items[0].no) {
                    var offset = _this.input.offset();
                    _this.template.appendTo("body");
                    _this.template.css({ "top": offset.top + _this.input.outerHeight() + "px", "left": offset.left + "px" });
                    _this.template.toggle(true);
                    _this.isShow = true;
                }
            }
        }
    })
}
ProductTips.prototype.hide = function () {
    this.template.toggle(false);
    this.template.empty();
    this.isShow = false;
}
//ProductTemplate
var ProductTemplate = function () {
    this.parent = null;
    this.tips = new ProductTips();
    this.template = $template.filter(".product-selecter-area").clone();
    this.list = this.template.find("ul");
    this.liTemplate = this.list.find("li").eq(0).clone();
    this.list.empty();
    var _this = this;
    $(".del", this.liTemplate).toggle(false);
}
ProductTemplate.prototype.bind = function (parent) {
    if (this.parent) {
        throw new Error("只能绑定一次");
    }
    this.parent = $(parent);
    this.parent.append(this.template);
}
ProductTemplate.prototype.add = function (name, brand, level, no) {
    var _this = this;
    var $li = this.liTemplate.clone();
    var $del = $(".del", $li);
    $del.click(function () { _this.del($li); });
    handleBinder("keyup", $(".name,.brand", $li), function () {
        var item = _this.getItem($li);
        !item.isEmpty() && item.verify(true);
    }, 50);
    $(".name,.brand", $li).blur(function () {
        _this.template.triggerHandler(ProductSelecter.event.change);
    });
    $(".name", $li).focus(function () {
        _this.tips.bind(this, $(".no", $li), function () {
            _this.lockName($li);
            _this.template.triggerHandler(ProductSelecter.event.change);
        });
    });
    $(".level", $li).on("click", function () {
        $(".level", $li).off("click");
        _this.getItem($li).verify(true);
        _this.template.triggerHandler(ProductSelecter.event.change);
    }).find("input").each(function (i, elem) { $(elem).attr("name", "product-class-level-" + levelNum); });
    $(".name-text-area .reset", $li).click(function () {
        $li.data("lock", false);
        $(this).parent().toggle(false);
        $(".name", $li).val('').toggle(true).focus();
    })
    this.list.append($li);
    if (name) {
        $(".name", $li).val(name);
        this.lockName($li);
        $li.data("originalVal", {
            name: name,
            brand: brand,
            no: no,
            level: level
        });
        this.template.triggerHandler(ProductSelecter.event.change);
    }
    brand && $(".brand", $li).val(brand);
    level && $(".level", $li).find("input[value='" + level + "']").prop("checked", true);
    no && $(".no", $li).val(no);
    levelNum++;
    this.list.find(".del").toggle(this.list.children().length > 1);
    this.template.triggerHandler(ProductSelecter.event.add, [$li]);
}
ProductTemplate.prototype.lockName = function ($li) {
    if (!$li.data("lock")) {
        var nameArea = $(".name-text-area", $li);
        var name = $(".name", $li);
        var val = $.trim(name.val());
        if (val) {
            $(".text", nameArea).text(val);
            name.toggle(false);
            nameArea.toggle(true);
            $li.data("lock", true);
        }
    }
}
ProductTemplate.prototype.del = function ($li) {
    if (this.list.children().length == 2) {
        this.list.find(".del").toggle(false);
    }
    $li.remove();
}
ProductTemplate.prototype.getItems = function () {
    var items = [], _this = this;
    this.list.children().each(function (i, elem) {
        items.push(_this.getItem(elem));
    });
    return items;
}
ProductTemplate.prototype.getItem = function (elem) {
    return new ProductItem(
            $(".name", elem), $(".brand", elem), $(".level", elem), $(".no", elem),
            $(elem).data("originalVal")
        );
}
//ProductItem
var ProductItem = function (name, brand, level, no, original) {
    this.name = name;
    this.brand = brand;
    this.level = level;
    this.no = no;
    this.original = original || {};
}
ProductItem.prototype.getVal = function (fillIncompleteFromOriginal) {
    var vals = {
        name: $.trim(this.name.val()),
        brand: $.trim(this.brand.val()),
        level: this.level.find("input").filter(":checked").val(),
        no: this.no.val()
    };
    if (fillIncompleteFromOriginal && vals.name == this.original.name) {
        vals.name = vals.name || this.original.name;
        vals.brand = vals.brand || this.original.brand;
        vals.level = vals.level || this.original.level;
        vals.no = vals.no || this.original.no;
    }
    return vals;
}
ProductItem.prototype.isEmpty = function () {
    var vals = this.getVal();
    return !vals.name && !vals.brand && !vals.level;
}
ProductItem.prototype.isIncomplete = function (fillIncompleteFromOriginal) {
    var vals = this.getVal(fillIncompleteFromOriginal);
    return !vals.name || !vals.brand || !vals.level;
}
ProductItem.prototype.verify = function (inertia) {
    var vals = this.getVal();
    this.clearError();
    var result = true;
    if (!vals.name) {
        result = false;
        this.appendError(inertia, this.name, "请输入产品名称");
    }
    if (!vals.brand) {
        result = false;
        this.appendError(inertia, this.brand, "请输入品牌名称");
    }
    if (!vals.level) {
        result = false;
        this.appendError(inertia, this.level.last(), "请选择产品档次");
    }
    return result;
}
ProductItem.prototype.appendError = function (inertia, elem, msg) {
    if (inertia) elem = elem.filter(".verified");
    elem.addClass("verified").after($('<span class="error">' + msg + "</span>"));
}
ProductItem.prototype.clearError = function () {
    this.name.next().remove();
    this.brand.next().remove();
    this.level.last().next().remove();
}
//ProductSelecter
var ProductSelecter = function () {
    this.template = new ProductTemplate();
}
ProductSelecter.prototype.bind = function (parent) {
    this.template.bind(parent);
}
ProductSelecter.prototype.add = function (name, brand, level, no) {
    this.template.add(name, brand, level, no);
}
ProductSelecter.prototype.verify = function () {
    var items = this.template.getItems();
    if(items.length == 1)
        return items[0].verify();
    else{        
        var result = true;
        var existsNotEmpty = false;
        for (var i = 0; i < items.length; i++) {
            if (!items[i].isEmpty()) {
                existsNotEmpty = true;
                result = items[i].verify() && result;
            }
        }
        if (result && !existsNotEmpty)
            return items[0].verify();
        else
            return result;
    }
}
ProductSelecter.prototype.getVal = function (excludeIncomplete, fillIncompleteFromOriginal) {
    var items = this.template.getItems();
    var vals = [];
    for (var i = 0; i < items.length; i++) {
        if (!items[i].isEmpty()) {
            if (!excludeIncomplete || !items[i].isIncomplete(fillIncompleteFromOriginal)) {
                vals.push(items[i].getVal(fillIncompleteFromOriginal));
            }
        }
    }
    return vals;
}
ProductSelecter.prototype.on = function (handler, func) {
    this.template.template.on(handler, func);
}
ProductSelecter.prototype.off = function (handler, func) {
    this.template.template.off(handler, func);
}
ProductSelecter.event = {
    change: "change.ProductSelecter",
    add: "add.ProductSelecter"
}
window.ProductSelecter = ProductSelecter;
module.exports = ProductSelecter;