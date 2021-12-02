public with sharing class futureApex {
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
       //system.debug(query);
      // set<id> prodIds = new Set<id>();
       list<PricebookEntry> results = Database.query(query);
	//	      for(pricebookentry x:results){
      //    			prodIds.add(x.Product2Id);
    //  }
      	//system.debug('prodIds '+prodIds);
     // cpqApex.inventoryCount(prodIds); 
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

    @AuraEnabled(cacheable=true)
    public static list<Sales_Doc_Detail__c> onLoadGetLastPaid(id accountId, list<string> productCodes){
        list<Sales_Doc_Detail__c> lastPaidList = new list<Sales_Doc_Detail__c>(); 
        map<string, date> sales = new map<string, date>();
        try {
            for(Sales_Doc_Detail__c record: [select id,name,Unit_Price__c,Margin__c, Doc_Date__c from sales_doc_detail__c
            where Product_Code__c In: (productCodes) and Sales_Document__r.customer__c =: accountId
            order by Sales_Document__r.doc_date__c desc]){
                if((lastPaidList = sales.get(record.Product_Code__c)) == null){
                    sales.put(record.Product_Code__c, record.Doc_Date__c);
                }
                lastPaidList.add(record)
            }
            system.debug('lp '+lastPaidList); 
            return lastPaidList; 
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


Contact[] temp;
Map<Id, Contact[]> mapcontacts = new map<Id, Contact[]>();
for(Contact record: [SELECT AccountId FROM Contact]) {
    if((temp = mapcontacts.get(record.AccountId)) == null) {
        mapcontacts.put(record.AccountId, temp = new Contact[0]);
    }
    temp.add(record);
}
}


(Sales_Doc_Detail__c:{Id=a0F1D000002KQIQUA4, Name=SO94350126 line 2, Unit_Price__c=450.00, Margin__c=100.00, Doc_Date__c=2021-07-14 00:00:00, Product_Code__c=FMC1035-4LB, Sales_Document__c=a0E1D000007TQ1ZUAW}, 
Sales_Doc_Detail__c:{Id=a0F1D000002KQILUA4, Name=SO94350126 Line 1, Unit_Price__c=363.00, Margin__c=35.99, Doc_Date__c=2021-07-14 00:00:00, Product_Code__c=FMC1061-16OZ, Sales_Document__c=a0E1D000007TQ1ZUAW})