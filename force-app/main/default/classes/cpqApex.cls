public class cpqApex {
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
    
    
    //will look for similar cat products if nothing above is returned. 
    @AuraEnabled
    public static PricebookEntry[] similarProducts(){
        return null; 
    }
}