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
      String query = 'Select Id,'
                + '  Product2.ProductCode, Product2.Name, Product2.Product_Status__c,UnitPrice, Product2.Product_Family__c, Product2.Subcategory__c, '
                + '  Product2.Floor_Type__c, Product2.Floor_Price__c'
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
       system.debug(query);	 
      return Database.query(query); 
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
        List<sales_doc_detail__c> orderList =  [select id,name,Unit_Price__c,Margin__c from sales_doc_detail__c
                				  	 			where Product_Code__c =: code and Sales_Document__r.customer__c =: accountId
                				  	 			order by Sales_Document__r.doc_date__c desc
                				  	 			limit 1];
        if(!orderList.isEmpty()){
            order = orderList[0];
        }
        system.debug(order);
        return order; 
    }
    //get saved opportunity line items
    @AuraEnabled
    public static list<OpportunityLineItem> getProducts(string oppId){
        list<OpportunityLineItem> opLi = [select id, pricebookEntryId, product2Id,product2.name,Product2.ProductCode, TotalPrice,
                                          Quantity, UnitPrice,Margin_Percent__c, Cost__c, OpportunityId from OpportunityLineItem
                                         	where opportunityId =: oppId];
        system.debug(opLi);
        return opLi; 
    }
    
    //save products
    @AuraEnabled
    public static List<OpportunityLineItem> createProducts(List<OpportunityLineItem> olList){
        system.debug('Opp Line ' + olList);
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
            ol.Margin__c = x.Margin_Percent__c;
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
            ol.Margin__c = x.Margin_Percent__c;
            ol.Cost__c = x.Cost__c;
            //ol.TotalPrice = x.TotalPrice; 
            //ol.OpportunityId = x.OpportunityId;
        }
            
      
            toUpsert.add(ol);
        }
        
        try{
            Database.upsert(toUpsert);
        }catch(exception e){
            system.debug(e);
        }
        return olList; 
    }
    
    //will look for similar cat products if nothing above is returned. 
    @AuraEnabled
    public static PricebookEntry[] similarProducts(){
        return null; 
    }
}