public with sharing class cpqApex {
    
    //get pricebooks
    @AuraEnabled(cacheable = true)
    public static list<priceBookWrapper> getPriceBooks(){
        list<priceBookWrapper> pw = new list<priceBookWrapper>();
        
        for(Pricebook2 x :[select id, name from Pricebook2 where IsActive = true]){
            pw.add(new priceBookWrapper(x.name, x.id));
        }
        return pw; 
    }
	//Product Search
	@AuraEnabled 
  public static PricebookEntry[] searchProduct(string searchKey, string cat, string family, string priceBookId){
      string searchterm = '%' + searchKey + '%'; 
      string category = cat; 
      string pf = family; 
      string pbId = priceBookId; 
      system.debug(pf);
      system.debug(searchterm);
      String query = 'Select Id,'
                + '  Product2.ProductCode, Product2.Name, Product2.Product_Status__c,UnitPrice, Product2.Product_Family__c, Product2.Subcategory__c, '
                + '  Product2.Floor_Type__c, Product2.Floor_Price__c, product2.agency__c, product2.Total_Product_Items__c'
                + ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND'; 
                 
      if(!searchterm.contains('null') && category == 'All' && pf == 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)';
      }else if (!searchterm.contains('null') && category != 'All' && pf == 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.subcategory__c =:category';
      }else if(!searchterm.contains('null') && category == 'All' && pf != 'All'){
          query += ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm) and Product2.Product_Family__c =:pf';
      }else if (searchterm.contains('null') && category != 'All' && pf == 'All'){
          query += ' Product2.subcategory__c =:category';
      }else if(searchterm.contains('null') && category == 'All' && pf != 'All'){
          query += ' Product2.Product_Family__c =:pf';
      }else if(searchterm.contains('null') && category != 'All' && pf != 'All'){
          query += ' Product2.Product_Family__c =:pf and Product2.subcategory__c =:category'; 
      }else{
         
      }		 
       
       list<PricebookEntry> results = Database.query(query);
      return results; 
  } 
    
    //this is where we try and get the inventory. For now we are gonna show the inventory across all locations
    //then will get at that location on select similar to last paid. 
    @AuraEnabled(cacheable = true)
        public static list<productitem> inventoryCount(list<id> ids){
            list<productitem> counts = [select id, quantityonhand,Product2Id from productitem
                                       where product2Id in : ids];
            system.debug('inven count '+counts);
            return counts; 
        }

    @AuraEnabled(cacheable = true)
    public static id getStandardId(string prodCode){
        id sID = [SELECT Id FROM PricebookEntry WHERE Pricebook2.Name LIKE '%Standard%' AND Product2.ProductCode =: prodCode limit 1].Id;
        system.debug('prodCode '+ prodCode);
        system.debug('sId '+ sId);
        return sId; 
    }
    @AuraEnabled(cacheable=true)
    public static Sales_Doc_Detail__c getLastPaid(string accountID, string Code){
        sales_doc_detail__c order = null; 
        List<sales_doc_detail__c> orderList =  [select id,name,Unit_Price__c,Margin__c, Doc_Date__c from sales_doc_detail__c
                				  	 			where Product_Code__c =: code and Sales_Document__r.customer__c =: accountId
                				  	 			order by Sales_Document__r.doc_date__c desc
                				  	 			limit 1];
        if(!orderList.isEmpty()){
            order = orderList[0];
        }
        system.debug(order);
        return order; 
    }
    @AuraEnabled(cacheable=true)
    public static ProductItem getInventory(string locId, string pId){
        ProductItem count = null;
        
        list<ProductItem> countList = [select id, QuantityOnHand from productitem 
                            	  where LocationId =:locId and Product2Id =:pId limit 1];
        
        if(!countList.isEmpty()){
            count = countList[0];
        }
        return count;
    }
    
    //save products
    @AuraEnabled
    public static string createProducts(List<OpportunityLineItem> olList){
        system.debug('Opp Line ' + olList);
        string mess; 
        list<OpportunityLineItem> toUpsert = new list<OpportunityLineItem>();
        
        for(OpportunityLineItem x : olList){
            OpportunityLineItem ol = new OpportunityLineItem();
            if(String.isBlank(x.Id)){
                //ol.Id = x.Id;
                system.debug(x.ProductCode); 
            ol.PricebookEntryId = x.PricebookEntryId;
            ol.Product2Id = x.Product2Id;
            ol.Quantity = x.Quantity;
            ol.UnitPrice = x.UnitPrice;
            ol.CPQ_Margin__c = x.CPQ_Margin__c;
            ol.Cost__c = x.Cost__c;
            //ol.TotalPrice = x.TotalPrice; 
            ol.OpportunityId = x.OpportunityId;
        }else if(!String.isBlank(x.Id)){
            system.debug(x.Name);
            ol.Id = x.Id; 
            //ol.PricebookEntryId = x.PricebookEntryId;
            //ol.Product2Id = x.Product2Id;
            ol.Quantity = x.Quantity;
            ol.UnitPrice = x.UnitPrice;
            ol.CPQ_Margin__c = x.CPQ_Margin__c;
            ol.Cost__c = x.Cost__c;
            //ol.TotalPrice = x.TotalPrice; 
            //ol.OpportunityId = x.OpportunityId;
        }
            
      
            toUpsert.add(ol);
        }
        
        try{
            Database.upsert(toUpsert);
            mess = 'success';
        }catch(exception e){
            mess = string.valueOf(e);
        }
        return mess; 
    }
    
    //ON LOAD SECTION
    //Get products and last paid when a opportunities are loaded!
        //get saved opportunity line items
    @AuraEnabled
    public static list<OpportunityLineItem> getProducts(string oppId){
        list<OpportunityLineItem> opLi = [select id, pricebookEntryId, product2Id,product2.name,Product2.ProductCode, TotalPrice,
                                          product2.agency__c, Quantity, UnitPrice,CPQ_Margin__c, Cost__c, OpportunityId 
                                          from OpportunityLineItem where opportunityId =: oppId];
        system.debug(opLi);
        return opLi; 
    }
    //Get inventory on load
        @AuraEnabled(cacheable=true)
    public static list<ProductItem> onLoadGetInventory(string locId, list<id> pIds){
        list<ProductItem> cl; 
        system.debug('pIds '+pIds + ' locId '+locId);
        list<ProductItem> countList = [select product2id, QuantityOnHand from productitem
                                      where LocationId =: locId and product2id in:(pIds)];
        
        if(!countList.isEmpty()){
            cl = countList; 
        }
        //system.debug('cl ' +cl);
        return cl; 
    }
    @AuraEnabled(cacheable=true)
    public static list<Sales_Doc_Detail__c> onLoadGetLastPaid(id accountId,list<string> productCodes){
        list<Sales_Doc_Detail__c> lastPaidList = new list<Sales_Doc_Detail__c>(); 
		system.debug('pc '+ productCodes);
        system.debug('accId '+ accountId);
        try {
            Sales_Doc_Detail__c[] temp;
			Map<String, Sales_Doc_Detail__c[]> sales = new map<String, Sales_Doc_Detail__c[]>();
                
			for(Sales_Doc_Detail__c record: [select id,name,Unit_Price__c,Margin__c, Doc_Date__c, Product_Code__c from sales_doc_detail__c
            	where Product_Code__c In: (productCodes) and Sales_Document__r.customer__c =: accountId
            	order by Sales_Document__r.doc_date__c desc]) {
    				if((temp = sales.get(record.Product_Code__c)) == null) {
        				sales.put(record.Product_Code__c, temp = new Sales_Doc_Detail__c[0]);
                   		lastPaidList.add(record); 
    				}
    			temp.add(record);
            }
            
            return lastPaidList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    //will look for similar cat products if nothing above is returned. 
  //  @AuraEnabled
   // public static PricebookEntry[] similarProducts(){
   //     return null; 
    //}
}