/**
 * Binds a TinyMCE widget to <textarea> elements.
 */
angular.module('ui.tinymce', [])
  .value('uiTinymceConfig', {})
  .directive('uiTinymce', ['uiTinymceConfig', function (uiTinymceConfig) {
    uiTinymceConfig = uiTinymceConfig || {};
    var generatedIds = 0;
    return {
      priority: 10,
      require: 'ngModel',
      link: function (scope, elm, attrs, ngModel) {
        var expression, options, tinyInstance,
          updateView = function () {
            if(elm.prop("tagName").toLowerCase() === 'textarea') {
                ngModel.$setViewValue(elm.val());
            } else {
                ngModel.$setViewValue(elm.html());
            }
            if (!scope.$root.$$phase) {
              scope.$apply();
            }
          };

        // generate an ID if not present
        if (!attrs.id) {
          attrs.$set('id', 'uiTinymce' + generatedIds++);
        }

        if (attrs.uiTinymce) {
          expression = scope.$eval(attrs.uiTinymce);
        } else {
          expression = {};
        }

        // make config'ed setup method available
        if (expression.setup) {
          var configSetup = expression.setup;
          delete expression.setup;
        }

        options = {
          // Update model when calling setContent (such as from the source editor popup)
          setup: function (ed) {
            var args;
            ed.on('init', function(args) {
              ngModel.$render();
              ngModel.$setPristine();
            });
            // Update model on button click
            ed.on('ExecCommand', function (e) {
              ed.save();
              updateView();
            });
            // Update model on keypress
            ed.on('KeyUp', function (e) {
              ed.save();
              updateView();
            });
            // Update model on change, i.e. copy/pasted text, plugins altering content
            ed.on('SetContent', function (e) {
              if (!e.initial && ngModel.$viewValue !== e.content) {
                ed.save();
                updateView();
              }
            });
            ed.on('blur', function(e) {
                elm.blur();
            });
            // Update model when an object has been resized (table, image)
            ed.on('ObjectResized', function (e) {
              ed.save();
              updateView();
            });
            //clicking on the text
            ed.on("click", function(e){
              //bind click icons to update
              $(".mce-widget").on('click', function(e){
                ed.save();
                updateView();
                setTimeout(function(){
                  $(".mce-grid-cell").on('click', function(e){
                    setTimeout(function(){
                      ed.save();
                      updateView();
                    }, 10);
                  });
                },50);
              });
            });
            ed.addButton('var', {
                type: 'menubutton',
                text: 'Variables',
                icon: false,
                menu: [
                    {text: 'Nombre', onclick: function() {ed.insertContent('{name}');}},
                    {text: 'Apellido 1', onclick: function() {ed.insertContent('{surname_1}');}},
                    {text: 'Apellido 2', onclick: function() {ed.insertContent('{surname_2}');}},
                    {text: 'Cupón', onclick: function() {ed.insertContent('{coupon}');}},
                    {text: 'Puntos disponibles', onclick: function() {ed.insertContent('{score_available}');}}
                ]
            });
            ed.addButton('clear', {
                text: 'Borrar todo',
                icon: false,
                onclick : function() {
                  ed.setContent('');
                }
            });
            if (configSetup) {
              configSetup(ed);
            }
          },
          style_formats: [
              {title: "Tamaño", items: [
                  {title: "Normal", format: "p"},
                  {title: "Título 1", format: "h1"},
                  {title: "Título 2", format: "h2"},
                  {title: "Título 3", format: "h3"}
              ]},
              {title: "En línea", items: [
                  {title: "Negrita", icon: "bold", format: "bold"},
                  {title: "Cursiva", icon: "italic", format: "italic"},
                  {title: "Subrayado", icon: "underline", format: "underline"},
                  {title: "Tachado", icon: "strikethrough", format: "strikethrough"},
                  {title: "Superíndice", icon: "superscript", format: "superscript"},
                  {title: "Subíndice", icon: "subscript", format: "subscript"}
              ]}
          ],
          theme_advanced_fonts : "Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n",
          mode: 'exact',
          elements: attrs.id
        };
        // extend options with initial uiTinymceConfig and options from directive attribute value
        angular.extend(options, uiTinymceConfig, expression);
        setTimeout(function () {
          tinymce.init(options);
        });

        ngModel.$render = function() {
          if (!tinyInstance) {
            tinyInstance = tinymce.get(attrs.id);
          }
          if (tinyInstance) {
            tinyInstance.setContent(ngModel.$viewValue || '');
          }
        };

        scope.$on('$destroy', function() {
          if (!tinyInstance) { tinyInstance = tinymce.get(attrs.id); }
          if (tinyInstance) {
            tinyInstance.remove();
            tinyInstance = null;
          }
        });

      }
    };
  }]);
