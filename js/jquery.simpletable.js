/**
 * Created by Kenny on 2017/5/21.
 */
;(function ($, window, document, undefined) {
  /**
   * Array 方法扩展，对于类似此格式的数组对象根据 key 和 value 进行替换，如果
   * 原来的数组中不存在 name 为 key 的对象，则在原来的数组的基础上进行追加
   * [{name:"key1", value:"value1"},
   *  {name:"key2", value:"value2"},
   *  ...
   *  {name:"keyn", value:"valuen"}]
   * @param key
   * @param value
   */
  Array.prototype.replaceValue = function (key, value) {
    if (key && value) {
      for (var i = 0; i < this.length; i++) {
        if (this[i].name === key) {
          this[i].value = value;
          return;
        }
      }
      this.push({name: key, value: value});
    }
  };

  //定义SimpleTable的构造函数
  var SimpleTable = function (ele, opt) {
    //调用此插件的jquery元素，即包装 table 元素的 jQuery 对象
    this._element = ele;
    //默认参数
    this.defaults = {
      //跟表格搭配使用的组件
      'searchForm': null,  //搜索组件
      'table': null, //表格组件
      'sizeSelect': null, //表格每页数据行数设置组件
      'pagination': null, //翻页组件

      //表格相关参数
      'idField': null,  //id字段名，用来唯一标识一行数据
      'columns': undefined,  //列对象数组
      'data': null, //填充表格的数据
      'tdMaxLength': 20, //每个单元格最多有多少个字符，超过之后进行截取

      //表格每页数据行数设置组件
      'pageSize':10,  //每页大小
      'pageList':[10, 20, 30, 40, 50],  //每页大小选择列表

      //翻页组件相关参数
      'pageNumber': 1,  //页数

      //ajax 相关参数
      'url': '#', //获取数据的url
      'dataType': 'json', //数据类型
      'method': 'get',//获取数据的方法
      'queryParams': {}  //查询参数
    };
    //合并后的选项
    this.options = $.extend({}, this.defaults, opt);
    /**
     * 初始化插件结构
     * @param str
     * @returns {*}
     */
    var initStructure = function (target) {
      var structure = '<div class="row"><div></div></div>' +
        '<div class="row"><div><table class="table table-bordered table-hover"></table></div></div>' +
        '<div class="row">' +
        '<div class="col-xs-3 col-md-3">' +
        '<form class="form-inline">' +
        '<div class="form-group"><label>显示行数:</label><select class="form-control"></select></div>' +
        '</form></div>' +
        '<div class="col-xs-6 col-md-6"><nav></nav></div>' +
        '<div class="col-xs-3 col-md-3">' +
        '<form class="form-inline">' +
        '<div class="form-group"><label>跳页:</label><input type="number" class="form-control" name="page" placeholder="输入跳转的页数" min="1"></div>' +
        '</form></div>' +
        '</div>';
      target.append(structure);
    };

    //TODO 测试阶段，代码抽取提供自定义样式接口
    var initStyle = function (target) {
      var $form = target.find('div:first form:first');
      $form.css({"margin": "0px 0px 20px 0px"});
      $form.find("input").width('120%');
      $form.find("button:first").css("float", "right");
      var $div = target.find('.row:eq(1)');
      $div.css("overflow", "auto");
      $div.find('div:first').css({"width": "120%", "height": "429px"});
    };

    initStructure(this._element);
    this.options.searchForm.appendTo(this._element.find('.row div:first'));
    this.options.table = this._element.find('table:first');
    this.options.sizeSelect = this._element.find('select:first');
    this.options.pagination = this._element.find('nav:first');
    initStyle(this._element);
    //表格初始化
    this.init();
  };
//定义SimpleTable的方法
  SimpleTable.prototype = {
    //表格初始化
    init: function () {
      var that = this;
      //清空表单数据
      that.options.searchForm.find('input').val('');
      this.options.searchForm.submit(function () {
        that.getParams();
        that.options.queryParams.push({name: "page", value: 1});
        that.options.pageNumber = 1;
        that.getDataFromService();
        return false;
      });
      var $lastForm = this._element.find('.row:eq(2) input:first');
      $lastForm.change(function () {
        console.info('hello');
        that.getParams();
        that.options.queryParams.push({name: "page", value: this.value});
        that.options.pageNumber = parseInt(this.value);
        that.getDataFromService();
        return false;
      });
      return this;
    },
    //从服务器获取数据
    getDataFromService: function () {
      var that = this;
      $.ajax({
        type: this.options.method,
        url: this.options.url,
        data: this.options.queryParams,
        dataType: this.options.dataType,
        success: function (data) {
          that.options.data = data;
          that.processData();
        }
      });
      return that;
    },

    //填充表格
    fillTable: function () {
      var data = this.options.data;
      var columns = this.options.columns;
      this.options.table.empty();
      this.options.table.append("<thead><tr></tr></thead>").append("<tbody></tbody>");
      var $theadTr = this.options.table.find('thead tr');
      var $tbody = this.options.table.find('tbody');
      var i;
      //填充表头
      for (i = 0; i < columns.length; i++) {
        $theadTr.append('<th>' + columns[i].title + '</th>');
      }
      //填充表主体
      for (i = 0; i < data.rows.length; i++) {
        $tbody.append('<tr></tr>');
        for (var j = 0; j < columns.length; j++) {
          var t = data.rows[i][columns[j].filed];
          if (t) {
            if (t.length > this.options.tdMaxLength) {
              $tbody.find("tr").last().append('<td title=' + t + '>' + t.substr(0, this.options.tdMaxLength) + '...</td>');
            } else {
              $tbody.find("tr").last().append('<td>' + t + '</td>');
            }
          } else {
            $tbody.find("tr").last().append('<td></td>');
          }
        }
      }
      return this;
    },

    //填充表格每页数据行数设置组件
    fillSelect: function () {
      var that = this;
      var $sizeSelect = this.options.sizeSelect;
      var pageList = this.options.pageList;

      $sizeSelect.empty();
      var $index = this.options.pageSize / 10;
      //初始化选项
      for (var i = 0; i < pageList.length; i++) {
        $sizeSelect.append('<option>' + pageList[i] + '</option>')
      }
      //设置选中项
      $sizeSelect.find('option:nth-child(' + $index + ')').prop("selected", 'selected');
      //取消change事件
      $sizeSelect.unbind('change');
      //添加change事件
      $sizeSelect.change(function () {
        var selected = $sizeSelect.find('option:selected').text();
        that.options.pageSize = selected;
        $(this).blur();
        that.getParams();
        that.options.queryParams.push({name: "page", value: 1});
        that.options.pageNumber = 1;
        that.getDataFromService();
      });
      return that;
    },

    //填充翻页组件
    fillNav: function () {
      var that = this;
      var $pageNav = this.options.pagination;
      var data = this.options.data;

      $pageNav.empty();
      $pageNav.append('<ul style="margin: 0 auto;" class="pagination"></ul>');
      //选中翻页组件中 ul 元素
      var $navUl = $pageNav.find('ul').first();
      //上一页
      if (this.options.pageNumber == 1) {
        //当前页为第一页时上一页不可用
        $navUl.append('<li class="disabled"><a href="#" aria-label="Previous"><span aria-hidden="true">上页</span></a></li>');
      } else {
        $navUl.append('<li><a href="#" aria-label="Previous"><span aria-hidden="true">上页</span></a></li>');
      }
      //数据总数
      var pageSize = this.options.pageSize;
      var pageNumber = this.options.pageNumber;
      //数据总数
      var total = data.total;
      var number = total % pageSize;
      //总页数
      var totalPages = Math.floor(total / pageSize);
      totalPages = number === 0 ? totalPages : totalPages + 1;
      var i;
      if (totalPages > 10) {
        //前三个链接
        for (i = 1; i <= 3; i++) {
          if (i == pageNumber) {
            $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
          } else {
            $navUl.append('<li><a href="#">' + i + '</a></li>');
          }
        }
        //分情况处理
        if (pageNumber > 6 && pageNumber < totalPages - 4) {
          $navUl.append('<li class="disabled"><a href="#">...</a></li>');
          for (i = pageNumber - 2; i <= pageNumber + 2; i++) {
            if (i == pageNumber) {
              $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
            } else {
              $navUl.append('<li><a href="#">' + i + '</a></li>');
            }
          }
          $navUl.append('<li class="disabled"><a href="#">...</a></li>');
        } else if (pageNumber <= 6) {
          for (i = 4; i <= 6; i++) {
            if (i == pageNumber) {
              $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
            } else {
              $navUl.append('<li><a href="#">' + i + '</a></li>');
            }
          }
          $navUl.append('<li class="disabled"><a href="#">...</a></li>');
        } else if (pageNumber >= totalPages - 4) {
          $navUl.append('<li class="disabled"><a href="#">...</a></li>');
          for (i = totalPages - 4; i <= totalPages - 2; i++) {
            if (i == pageNumber) {
              $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
            } else {
              $navUl.append('<li><a href="#">' + i + '</a></li>');
            }
          }
        }
        //最后两个链接
        for (i = totalPages - 1; i <= totalPages; i++) {
          if (i == pageNumber) {
            $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
          } else {
            $navUl.append('<li><a href="#">' + i + '</a></li>');
          }
        }
      } else {
        for (i = 1; i <= totalPages; i++) {
          if (i == pageNumber) {
            $navUl.append('<li class= "active"><a href="#">' + i + '</a></li>');
          } else {
            $navUl.append('<li><a href="#">' + i + '</a></li>');
          }
        }
      }
      //下一页
      if (pageNumber == totalPages) {
        //当前页等于最后一页时下一页不可用
        $navUl.append('<li class="disabled"><a href="#" aria-label="Next"><span aria-hidden="true">下页</span></a></li>');
      } else {
        $navUl.append('<li><a href="#" aria-label="Next"><span aria-hidden="true">下页</span></a></li>');
      }

      //获取翻页组件中的链接
      var $pageNavLinks = this.options.pagination.find('ul li a');
      //给翻页组件当中的链接添加 click 事件
      $pageNavLinks.click(function () {
        var text = $(this).text();
        //上下页特殊处理
        if (text === '上页' || text === '下页' || text === '...') {
          $(this).blur();
          if (text !== '...') {
            //移除其 active 特性
            $(this).parent().siblings().removeClass("active");
            if (text === '上页' && that.options.pageNumber > 1) {
              that.getParams();
              that.options.queryParams.replaceValue("page", that.options.pageNumber - 1);
              that.options.pageNumber--;
              that.getDataFromService();
            } else if (text !== '...'){
              $(this).parent().next().addClass("active");
            }
            if (text === '下页' && that.options.pageNumber < totalPages) {
              that.getParams();
              that.options.queryParams.replaceValue("page", that.options.pageNumber + 1);
              that.options.pageNumber++;
              that.getDataFromService();
            } else if (text !== '...'){
              $(this).parent().prev().addClass("active");
            }
          }
        } else {
          $(this).parent().addClass("active").siblings().removeClass("active");
          $(this).blur();
          that.getParams();
          that.options.queryParams.replaceValue("page", text);
          that.options.pageNumber = parseInt(text);
          that.getDataFromService();
        }
        return false;
      });
      return that;
    },

    //数据处理
    processData: function () {
      this.fillTable();
      this.fillSelect();
      this.fillNav();
      return this;
    },

    //获取参数
    getParams: function () {
      this.options.queryParams = this.options.searchForm.serializeArray();
      var size = this.options.sizeSelect.find("option:selected").text();
      this.options.queryParams.push({name: "size", value: size});
      return this;
    }
  };
  //在插件中使用Beautifier对象
  $.fn.simpleTable = function (options) {
    //创建SimpleTable的实体

    //第一个参数为 this, 把调用此插件的 jQuery 对象(jQuery包装的table元素)传递给 _element ,
    // 在插件内部， _element 即为调用此插件的元素
    var simpleTable = new SimpleTable(this, options);
    //调用其方法
    return simpleTable;
  };
})(jQuery, window, document);