jQuery.sap.require("sap.m.MessageBox");
sap.ui.controller("espm-mobile-shopping.CreditCardDetails", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to
	 * modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 */
	onInit : function() {

	},

	onBeforeShow : function(evt) {
		var view = this.getView();
		view.radioButton3.setSelected(true);
		this.customerId = evt.data.details.CustomerId;
		view.sName.getContent()[0].setValue(evt.data.details.FirstName + " " + evt.data.details.LastName);
	},

	// clicking on the Order button
	orderTap : function(evt) {
		var con = this;
		var flag = 0;
		var view = this.getView();
		var inputs = [ view.sName.getContent()[0], view.sNumber.getContent()[0], view.sCode.getContent()[0], ];
		for (var i = 0; i < inputs.length; i++) {
			if (!inputs[i].getValue()) {
				inputs[i].setValueState(sap.ui.core.ValueState.Error);
				flag = 1;
			}
		}
		if (flag == 0) {
			con.createSalesOrder();
		}
	},

	// creating the sales order
	createSalesOrder : function(evt) {
		var genaralText = appC.i18n.getProperty("DIALOG_GENERAL_TEXT");
		var refIdText = appC.i18n.getProperty("DIALOG_REF_ID_TEXT");
		var amountText = appC.i18n.getProperty("DIALOG_AMOUNT_TEXT");
		// when data is read from HANA Cloud
		if (sap.app.config.useAbap == false) {
			var oEntrySo = {};
			oEntrySo.CustomerId = this.customerId;
			oEntrySo.SalesOrderItems = [];
			for (var i = 0; i < appC.cartItems.length; i++) {
				var oEntrySI = {};
				oEntrySI.ItemNumber = ((i + 1) * 10);
				oEntrySI.ProductId = appC.cartItems[i].productId;
				oEntrySI.Quantity = appC.cartItems[i].quantity + "";
				oEntrySI.QuantityUnit = "EA";
				oEntrySI.DeliveryDate = "2013-07-01T11:55:00";
				oEntrySo.SalesOrderItems[oEntrySo.SalesOrderItems.length] = oEntrySI;
			}

			// creating sales order using OData model
			appC.oModel.create(sap.app.config.salesOrderHeaderCollection, oEntrySo, null, function(oData, oResponse) {
				// alert("success");
				// Sales Order Creation successful
				appC.salesOrderId = oResponse.data.SalesOrderId;

				sap.m.MessageBox.show(genaralText + '\n' + refIdText + appC.salesOrderId + '\n' + amountText
						+ appC.total + sap.app.config.currencySymbol, sap.m.MessageBox.Icon.SUCCESS,
						"{i18n>DIALOG_TITLE_SUCCESS}", [ sap.m.MessageBox.Action.CLOSE ], function(oAction) {
							// reset cart after order is complete
							appC.cartItems = new Array();
							// navigate back to the Home page
							appC.navTo("Category", true, undefined, "");
						});

				// linking to the customer and products
				var results = oData.SalesOrderItems.results;
				OData.request({
					requestUri : oData.__metadata.uri + "/$links/Customer",
					method : "PUT",
					data : {
						"uri" : "Customers('" + oResponse.data.CustomerId + "')"
					}
				}, function(data, response1) {
					var salesOrderHeaderUrl = oData.__metadata.uri;
					var sliceIndex = salesOrderHeaderUrl.indexOf('espm-cloud-web');
					var cloudUrl = salesOrderHeaderUrl.slice(0, sliceIndex - 1);
					OData.request({
						requestUri : cloudUrl + "/espm-cloud-web/espm.svc/GetSalesOrderItemsById?SalesOrderId='"
								+ appC.salesOrderId + "'",
						method : "GET",
					}, function(data, response) {
						// success handler
						var length = data.results.length;
						for (var i = 0; i < length; i++) {
							OData.request({
								requestUri : data.results[i].__metadata.uri + "/$links/Product",
								method : "PUT",
								data : {
									"uri" : "Products('" + data.results[i].ProductId + "')"
								}
							}, function(data, response) {

							}, function(error, response) {

							});
						}
					}, function(error, response) {

					});

				}, function(error, oResponse) {
				});

			}, function(oError) {
				// Sales Order Creation failed
			});
		}
		// when data is read from ABAP Gateway
		else if (sap.app.config.useAbap == true) {
			var oEntrySo = {};
			oEntrySo.CustomerId = this.customerId;
			oEntrySo.Items = [];
			for (var i = 0; i < appC.cartItems.length; i++) {
				var oEntrySI = {};
				oEntrySI.ProductId = appC.cartItems[i].productId;
				oEntrySI.Quantity = appC.cartItems[i].quantity + "";
				oEntrySI.QuantityUnit = "EA";
				oEntrySI.DeliveryDate = "2013-07-01T11:55:00.0000000";
				oEntrySo.Items[oEntrySo.Items.length] = oEntrySI;
			}
			// creating sales order using OData model
			appC.oModel.create(sap.app.config.salesOrderHeaderCollection, oEntrySo, null, function(oData, oResponse) {
				// Sales Order Creation successful
				appC.salesOrderId = oResponse.data.SalesOrderId;
			}, function(oError) {
				// Sales Order Creation failed
			});
			sap.m.MessageBox.show(genaralText + '\n' + refIdText + appC.salesOrderId + '\n' + amountText + appC.total
					+ sap.app.config.currencySymbol, sap.m.MessageBox.Icon.SUCCESS, "{i18n>DIALOG_TITLE_SUCCESS}",
					[ sap.m.MessageBox.Action.CLOSE ], function(oAction) {
						// reset cart after order is complete
						appC.cartItems = new Array();
						// navigate back to the Home page
						appC.navTo("Category", true, undefined, "");
					});
		}
	},
	// navigation to the previous screen
	navButtonTap : function(evt) {
		appC.navBack();
	},

	inputChangeTap : function(evt) {
		if (evt.oSource.getValue() != null) {
			evt.oSource.setValueState(sap.ui.core.ValueState.None);
		}
	},

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the
 * first rendering! onInit() is used for that one!).
 */
// onBeforeRendering: function() {
// },
/**
 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the
 * HTML could be done here. This hook is the same one that SAPUI5 controls get after being rendered.
 */
// onAfterRendering: function() {
// },
/**
 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
 */
// onExit: function() {
// }
});